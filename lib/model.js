/**
 * llama.cpp runtime + Hy-MT2 model management for `dsh-localllmtranslate`.
 *
 * One dedicated llama-server instance serves the translation panel and the
 * agent tool. It starts lazily on the first request, is single-concurrency
 * (`-np 1`) and is unloaded after the configured idle period.
 */

import { spawn, spawnSync } from 'node:child_process'
import { access, appendFile, open, readdir, rename, stat, unlink } from 'node:fs/promises'
import { constants as FS } from 'node:fs'
import { basename, join } from 'node:path'
import { DEFAULT_MODEL, asString, errorText, isObject } from './shared.js'

const HOST = '127.0.0.1'
const WAIT_TIMEOUT_MS = 180000
const HEALTH_TIMEOUT_MS = 1500

async function exists(file) {
  try {
    await access(file, FS.F_OK)
    return true
  } catch {
    return false
  }
}

function isFile(file) {
  return stat(file).then(info => info.isFile()).catch(() => false)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function splitArgs(text) {
  const args = []
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    args.push(match[1] ?? match[2] ?? match[3])
  }
  return args.filter(arg => arg !== '')
}

export class ModelManager {
  constructor(paths, settingsStore) {
    this.paths = paths
    this.settingsStore = settingsStore
    this.child = undefined
    this.port = 0
    this.ready = false
    this.phase = 'idle'
    this.error = ''
    this.startPromise = undefined
    this.activeRequests = 0
    this.lastUsedAt = 0
    this.logLines = []
    this.idleTimer = undefined
    this.download = {
      active: false,
      received: 0,
      total: 0,
      error: '',
      name: settingsStore.value.downloadName,
      startedAt: 0,
      url: settingsStore.value.downloadUrl,
    }
    this.downloadAbort = undefined
    this.modelCache = { at: 0, items: [] }
    this.runtimeCache = { at: 0, path: undefined }
  }

  /* ----------------------------- discovery ---------------------------- */

  async listModels(force = false) {
    const now = Date.now()
    if (!force && now - this.modelCache.at < 5000) return this.modelCache.items
    let names = []
    try {
      names = await readdir(this.paths.modelsDir)
    } catch {
      names = []
    }
    const items = []
    for (const name of names) {
      if (!/\.gguf$/i.test(name)) continue
      if (/\.part$/i.test(name)) continue
      const path = join(this.paths.modelsDir, name)
      if (!(await isFile(path))) continue
      const info = await stat(path).catch(() => undefined)
      items.push({ name, path, bytes: info?.size ?? 0 })
    }
    items.sort((left, right) => left.name.localeCompare(right.name))
    this.modelCache = { at: now, items }
    return items
  }

  /** Pick the configured model, the preferred F16 file, or any Hy-MT2 GGUF. */
  async resolveModel() {
    const settings = await this.settingsStore.load()
    if (settings.modelFile !== '' && await isFile(settings.modelFile)) {
      return { path: settings.modelFile, name: basename(settings.modelFile) }
    }
    const models = await this.listModels(true)
    if (models.length === 0) return undefined
    const preferred = models.find(model => model.name === DEFAULT_MODEL.name)
      ?? models.find(model => /hy[-_ ]?mt2/i.test(model.name) && /f16/i.test(model.name))
      ?? models.find(model => /hy[-_ ]?mt2/i.test(model.name))
      ?? models[0]
    return { path: preferred.path, name: preferred.name }
  }

  async findRuntime(force = false) {
    const settings = await this.settingsStore.load()
    const explicit = settings.llamaServerPath.trim()
    if (!force && explicit === '' && Date.now() - this.runtimeCache.at < 15000) {
      return this.runtimeCache.path
    }
    const found = await this.scanRuntime(explicit)
    if (explicit === '') this.runtimeCache = { at: Date.now(), path: found }
    return found
  }

  async scanRuntime(explicit) {
    const candidates = []
    if (explicit !== '') candidates.push(explicit)
    if (asString(process.env.LLAMA_SERVER_PATH).trim() !== '') {
      candidates.push(process.env.LLAMA_SERVER_PATH.trim())
    }
    const lookup = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['llama-server'], {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true,
    })
    if (lookup.status === 0 && asString(lookup.stdout).trim() !== '') {
      for (const line of String(lookup.stdout).split(/\r?\n/)) {
        if (line.trim() !== '') candidates.push(line.trim())
      }
    }
    // The local-model plugin keeps its runtime here; reuse it when present.
    candidates.push(join(this.paths.home, 'local-model', 'runtime', 'llama-server.exe'))
    candidates.push(join(this.paths.home, 'local-model', 'runtime', 'llama-server'))
    candidates.push(join(this.paths.home, 'local-model', 'runtime', 'bin', 'llama-server.exe'))
    const localRuntime = join(this.paths.home, 'local-model', 'runtime')
    try {
      const entries = await readdir(localRuntime, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        candidates.push(join(localRuntime, entry.name, 'llama-server.exe'))
        candidates.push(join(localRuntime, entry.name, 'llama-server'))
      }
    } catch {
      /* runtime dir may not exist */
    }
    // WinGet / Scoop style installs.
    const localAppData = asString(process.env.LOCALAPPDATA)
    if (localAppData !== '') {
      const wingetRoot = join(localAppData, 'Microsoft', 'WinGet', 'Packages')
      try {
        const entries = await readdir(wingetRoot, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory() || !/llamacpp|llama\.cpp/i.test(entry.name)) continue
          candidates.push(join(wingetRoot, entry.name, 'llama-server.exe'))
          const inner = await readdir(join(wingetRoot, entry.name), { withFileTypes: true }).catch(() => [])
          for (const child of inner) {
            if (!child.isDirectory()) continue
            candidates.push(join(wingetRoot, entry.name, child.name, 'llama-server.exe'))
          }
        }
      } catch {
        /* no winget */
      }
    }
    candidates.push('C:\\llama.cpp\\build\\bin\\llama-server.exe')
    candidates.push('D:\\llama.cpp\\build\\bin\\llama-server.exe')
    candidates.push('/opt/homebrew/bin/llama-server')
    candidates.push('/usr/local/bin/llama-server')
    candidates.push('/usr/bin/llama-server')
    if (asString(process.env.HOME).trim() !== '') {
      candidates.push(join(process.env.HOME.trim(), '.local', 'bin', 'llama-server'))
    }
    if (asString(process.env.USERPROFILE).trim() !== '') {
      candidates.push(join(process.env.USERPROFILE.trim(), '.local', 'bin', 'llama-server.exe'))
    }
    for (const candidate of candidates) {
      if (candidate.trim() === '') continue
      if (await isFile(candidate)) return candidate
    }
    return undefined
  }

  /* ------------------------------ status ------------------------------ */

  async status() {
    const settings = await this.settingsStore.load()
    const [model, runtime, models] = await Promise.all([
      this.resolveModel(),
      this.findRuntime(),
      this.listModels(),
    ])
    return {
      phase: this.phase,
      ready: this.ready,
      starting: this.startPromise !== undefined,
      error: this.error,
      port: this.port,
      pid: this.child?.pid ?? 0,
      host: HOST,
      model: model === undefined
        ? { found: false, path: '', name: '', bytes: 0 }
        : { found: true, path: model.path, name: model.name, bytes: (await stat(model.path).catch(() => undefined))?.size ?? 0 },
      runtime: { found: runtime !== undefined, path: runtime ?? '' },
      models,
      download: { ...this.download },
      lastUsedAt: this.lastUsedAt,
      idleUnloadMinutes: settings.idleUnloadMinutes,
      candidateUrl: settings.downloadUrl,
      candidateName: settings.downloadName,
      expectedBytes: DEFAULT_MODEL.size,
    }
  }

  /* ----------------------------- lifecycle ---------------------------- */

  async callPortAvailable(port) {
    const probe = async candidate => {
      try {
        const response = await fetch(`http://${HOST}:${candidate}/health`, {
          signal: AbortSignal.timeout(600),
        })
        return response.ok
      } catch {
        return false
      }
    }
    if (await probe(port)) return false
    const { createServer } = await import('node:net')
    return new Promise(resolve => {
      const server = createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => server.close(() => resolve(true)))
      server.listen(port, HOST)
    })
  }

  async pickPort(start) {
    for (let offset = 0; offset < 20; offset += 1) {
      const candidate = start + offset
      if (candidate > 65535) break
      if (await this.callPortAvailable(candidate)) return candidate
    }
    throw new Error('从 ' + start + ' 开始的 20 个端口都被占用了，请在设置里换一个端口')
  }

  async healthy() {
    if (this.port === 0) return false
    try {
      const response = await fetch(`http://${HOST}:${this.port}/health`, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async ensureReady() {
    if (this.ready && await this.healthy()) return this.port
    if (this.startPromise !== undefined) return this.startPromise
    this.startPromise = this.startServer()
    try {
      return await this.startPromise
    } finally {
      this.startPromise = undefined
    }
  }

  async startServer() {
    const settings = await this.settingsStore.load()
    if (this.child !== undefined) {
      await this.stop('restart')
    }
    const model = await this.resolveModel()
    if (model === undefined) {
      this.phase = 'error'
      this.error = '还没有模型文件。请打开左侧栏「翻译」，在设置里点「下载模型」，或把 GGUF 放进 ' + this.paths.modelsDir
      throw new Error(this.error)
    }
    const runtime = await this.findRuntime()
    if (runtime === undefined) {
      this.phase = 'error'
      this.error = '找不到 llama-server。请在「翻译 → 设置」里填写 llama-server 路径，或安装 llama.cpp 后重试。'
      throw new Error(this.error)
    }
    const port = await this.pickPort(settings.port)
    const args = [
      '-m', model.path,
      '--host', HOST,
      '--port', String(port),
      '-c', String(settings.ctxSize),
      '-ngl', String(settings.gpuLayers),
      '--jinja',
      '--no-warmup',
      '--alias', 'hy-mt2',
      '-np', '1',
    ]
    if (settings.overrideEos && /hy[-_ ]?mt2/i.test(model.name)) {
      // The community F16 conversion does not mark <|hy_place_holder_no_2|>
      // as an end-of-generation token, so the model keeps inventing text
      // after the translation. llama.cpp accepts the id override at load time.
      args.push('--override-kv', 'tokenizer.ggml.eos_token_id=int:120020')
    }
    if (settings.extraArgs.trim() !== '') args.push(...splitArgs(settings.extraArgs))

    this.phase = 'starting'
    this.error = ''
    this.port = port
    this.logLines = []
    const logLine = line => {
      this.logLines.push(line)
      if (this.logLines.length > 160) this.logLines.shift()
      appendFile(this.paths.logFile, line + '\n').catch(() => {})
    }
    logLine('[plugin] ' + new Date().toISOString() + ' spawn ' + runtime + ' ' + args.join(' '))
    const child = spawn(runtime, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    })
    this.child = child
    const onData = chunk => {
      for (const line of String(chunk).split(/\r?\n/)) {
        if (line.trim() !== '') logLine(line)
      }
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.once('exit', (code, signal) => {
      logLine('[plugin] llama-server exited code=' + String(code) + ' signal=' + String(signal))
      if (this.child === child) {
        this.child = undefined
        this.ready = false
        this.port = 0
        if (this.phase !== 'error') this.phase = 'idle'
      }
    })

    const startedAt = Date.now()
    while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
      if (this.child === undefined) break
      if (await this.healthy()) {
        this.ready = true
        this.phase = 'ready'
        this.error = ''
        this.startIdleTimer()
        return port
      }
      await sleep(500)
    }
    const tail = this.logLines.slice(-30).join('\n')
    this.ready = false
    const message = this.explainFailure(tail)
    await this.stop('failed')
    this.phase = 'error'
    this.error = message
    throw new Error(message)
  }

  explainFailure(tail) {
    const log = String(tail)
    if (/unknown model architecture/i.test(log)) {
      return '这个 GGUF 的架构不被当前 llama-server 支持，请升级 llama.cpp 或换一个模型文件。'
    }
    if (/out of memory|CUDA error|Vulkan.*memory|ggml_vulkan.*allocation/i.test(log)) {
      return '显存不足：请在「翻译 → 设置」里调低 GPU 层数（例如 20），或缩短上下文后重试。'
    }
    if (/failed to load model|error loading model/i.test(log)) {
      return 'llama-server 加载模型失败。可在设置里查看日志尾部：\n' + log.slice(-1200)
    }
    if (/Unknown argument|unknown flag|invalid argument/i.test(log)) {
      return 'llama-server 拒绝了启动参数（可能是版本差异）。请升级 llama.cpp 或在设置里清空「附加参数」：\n' + log.slice(-800)
    }
    if (this.child === undefined) {
      return 'llama-server 启动后立即退出。请检查模型路径与运行时是否匹配。\n' + log.slice(-1200)
    }
    return 'llama-server 在 ' + Math.round(WAIT_TIMEOUT_MS / 1000) + ' 秒内没有就绪。\n' + log.slice(-1200)
  }

  startIdleTimer() {
    if (this.idleTimer !== undefined) return
    this.idleTimer = setInterval(() => {
      if (this.ready && this.activeRequests === 0 && this.lastUsedAt > 0) {
        const minutes = this.settingsStore.value.idleUnloadMinutes
        if (minutes > 0 && Date.now() - this.lastUsedAt > minutes * 60000) {
          this.stop('idle').catch(() => {})
        }
      }
    }, 30000)
    this.idleTimer.unref?.()
  }

  async withServer(operation) {
    await this.ensureReady()
    this.activeRequests += 1
    this.lastUsedAt = Date.now()
    try {
      return await operation(this.port)
    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1)
      this.lastUsedAt = Date.now()
    }
  }

  async stop(reason = 'manual') {
    const child = this.child
    this.child = undefined
    this.ready = false
    this.phase = reason === 'idle' ? 'idle' : 'stopped'
    this.port = 0
    this.error = ''
    if (child === undefined || child.exitCode !== null) return
    const pid = child.pid
    try {
      child.kill()
    } catch {
      /* already gone */
    }
    const exited = new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 5000)
      child.once('exit', () => {
        clearTimeout(timer)
        resolve(true)
      })
    })
    if (!(await exited) && pid !== undefined) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 8000 })
      } else {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {
          /* gone */
        }
      }
    }
  }

  async dispose() {
    if (this.idleTimer !== undefined) {
      clearInterval(this.idleTimer)
      this.idleTimer = undefined
    }
    this.downloadAbort?.abort()
    await this.stop('dispose')
  }

  /* ----------------------------- download ----------------------------- */

  async startDownload() {
    if (this.download.active) return this.download
    const settings = await this.settingsStore.load()
    const target = join(this.paths.modelsDir, settings.downloadName)
    if (await isFile(target)) {
      await this.settingsStore.update({ modelFile: target })
      return { ...this.download, active: false, done: true, error: '', received: (await stat(target)).size, total: (await stat(target)).size }
    }
    const part = target + '.part'
    const existing = await stat(part).catch(() => undefined)
    const start = existing?.size ?? 0
    this.download = {
      active: true,
      received: start,
      total: start > 0 ? 0 : DEFAULT_MODEL.size,
      error: '',
      name: settings.downloadName,
      startedAt: Date.now(),
      url: settings.downloadUrl,
    }
    this.downloadAbort = new AbortController()
    this.runDownload(settings, target, part, start, this.downloadAbort.signal).catch(() => {})
    return { ...this.download }
  }

  async runDownload(settings, target, part, start, signal) {
    let handle
    try {
      const headers = start > 0 ? { range: 'bytes=' + start + '-' } : {}
      const response = await fetch(settings.downloadUrl, { headers, signal, redirect: 'follow' })
      if (!response.ok && response.status !== 206) {
        throw new Error('下载地址返回 HTTP ' + response.status + '：' + settings.downloadUrl)
      }
      const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        throw new Error('下载地址返回了网页或错误信息而不是 GGUF 文件，请检查下载地址是否正确')
      }
      const contentLength = Number(response.headers.get('content-length') ?? 0)
      const append = start > 0 && response.status === 206
      this.download.total = contentLength > 0 ? contentLength + (append ? start : 0) : this.download.total
      this.download.received = append ? start : 0
      handle = await open(part, append ? 'a' : 'w')
      if (response.body === null) throw new Error('下载响应没有内容')
      const reader = response.body.getReader()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        await handle.write(value)
        this.download.received += value.length
      }
      await handle.close()
      handle = undefined
      const info = await stat(part)
      if (info.size < 1024 * 1024) throw new Error('下载得到的文件小于 1 MiB，可能不是完整的模型文件')
      await unlink(target).catch(() => {})
      await rename(part, target)
      await this.settingsStore.update({ modelFile: target })
      this.download = { ...this.download, active: false, received: info.size, total: info.size, error: '' }
      this.modelCache = { at: 0, items: [] }
      if (this.child !== undefined) await this.stop('model-downloaded')
    } catch (error) {
      await handle?.close().catch(() => {})
      if (signal.aborted) {
        this.download = { ...this.download, active: false, error: '下载已取消，已下载的部分会保留，下次继续。' }
        return
      }
      this.download = { ...this.download, active: false, error: errorText(error) }
    }
  }

  cancelDownload() {
    this.downloadAbort?.abort()
    this.downloadAbort = undefined
    this.download = { ...this.download, active: false }
    return { ...this.download }
  }

  async openModelDirHint() {
    return this.paths.modelsDir
  }

  async diagnostics() {
    const runtime = await this.findRuntime()
    return {
      log: this.logLines.slice(-40).join('\n'),
      runtime: runtime ?? '',
      model: (await this.resolveModel())?.path ?? '',
      port: this.port,
      phase: this.phase,
    }
  }
}
