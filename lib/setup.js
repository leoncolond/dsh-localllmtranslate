/**
 * Guided llama.cpp runtime setup for `dsh-localllmtranslate`.
 *
 * The plugin never ships llama.cpp. On Windows it can install the official
 * `ggml.llamacpp` WinGet package with one click; on macOS it can use Homebrew.
 * Everywhere else the panel shows the exact command and a link to the release
 * page. The installer is fixed-command only (no user-supplied shell input).
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const RELEASES_URL = 'https://github.com/ggml-org/llama.cpp/releases'
const INSTALL_TIMEOUT_MS = 20 * 60 * 1000
const MAX_LOG_LINES = 120

function splitLines(text) {
  const clean = String(text || '').replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/\r/g, '')
  return clean.split('\n').filter(line => line.trim() !== '')
}

export class RuntimeInstaller {
  constructor(paths, manager) {
    this.paths = paths
    this.manager = manager
    this.child = undefined
    this.state = {
      active: false,
      phase: 'idle',
      log: '',
      error: '',
      exitCode: null,
      startedAt: 0,
      finishedAt: 0,
      runtimePath: '',
    }
    this.logLines = []
    this.wingetPath = undefined
    this.brewPath = undefined
  }

  findWinget() {
    if (this.wingetPath !== undefined) return this.wingetPath
    if (process.platform !== 'win32') {
      this.wingetPath = ''
      return this.wingetPath
    }
    const lookup = spawnSync('where.exe', ['winget'], { encoding: 'utf8', timeout: 3000, windowsHide: true })
    const first = String(lookup.stdout || '').split(/\r?\n/).find(line => line.trim() !== '')
    if (first) {
      this.wingetPath = first.trim()
      return this.wingetPath
    }
    const local = process.env.LOCALAPPDATA
    const fallback = local ? join(local, 'Microsoft', 'WindowsApps', 'winget.exe') : ''
    this.wingetPath = fallback !== '' && existsSync(fallback) ? fallback : ''
    return this.wingetPath
  }

  findBrew() {
    if (this.brewPath !== undefined) return this.brewPath
    if (process.platform !== 'darwin') {
      this.brewPath = ''
      return this.brewPath
    }
    const lookup = spawnSync('which', ['brew'], { encoding: 'utf8', timeout: 3000 })
    const first = String(lookup.stdout || '').trim()
    if (first !== '') {
      this.brewPath = first
      return this.brewPath
    }
    for (const candidate of ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']) {
      if (existsSync(candidate)) {
        this.brewPath = candidate
        return this.brewPath
      }
    }
    this.brewPath = ''
    return this.brewPath
  }

  command() {
    if (process.platform === 'win32') {
      return 'winget install --id ggml.llamacpp -e --accept-package-agreements --accept-source-agreements'
    }
    if (process.platform === 'darwin') return 'brew install llama.cpp'
    return '从 llama.cpp Releases 下载对应包，把 llama-server 放进 PATH'
  }

  canInstall() {
    if (process.platform === 'win32') return this.findWinget() !== ''
    if (process.platform === 'darwin') return this.findBrew() !== ''
    return false
  }

  info() {
    return {
      platform: process.platform,
      releasesUrl: RELEASES_URL,
      command: this.command(),
      canInstall: this.canInstall(),
      wingetAvailable: this.findWinget() !== '',
      brewAvailable: this.findBrew() !== '',
      install: { ...this.state },
    }
  }

  appendLog(text) {
    for (const line of splitLines(text)) {
      this.logLines.push(line)
      if (this.logLines.length > MAX_LOG_LINES) this.logLines.shift()
    }
    this.state.log = this.logLines.join('\n')
  }

  async start() {
    if (this.state.active) return { ...this.state }
    let executable = ''
    let args = []
    if (process.platform === 'win32') {
      executable = this.findWinget()
      if (executable === '') throw new Error('没有找到 winget，请从 llama.cpp Releases 手动下载，或先安装 App Installer')
      args = [
        'install',
        '--id', 'ggml.llamacpp',
        '-e',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity',
        '--silent',
      ]
    } else if (process.platform === 'darwin') {
      executable = this.findBrew()
      if (executable === '') throw new Error('没有找到 Homebrew，请先安装 Homebrew，或从 llama.cpp Releases 手动下载')
      args = ['install', 'llama.cpp']
    } else {
      throw new Error('当前平台没有一键安装；请从 ' + RELEASES_URL + ' 下载 llama.cpp 后手动配置')
    }
    this.logLines = []
    this.state = {
      active: true,
      phase: 'starting',
      log: '',
      error: '',
      exitCode: null,
      startedAt: Date.now(),
      finishedAt: 0,
      runtimePath: '',
    }
    this.appendLog('$ ' + executable + ' ' + args.join(' '))
    let child
    try {
      child = spawn(executable, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      })
    } catch (error) {
      this.state.active = false
      this.state.phase = 'error'
      this.state.error = String(error?.message || error)
      throw error
    }
    this.child = child
    this.state.phase = 'installing'
    const onData = chunk => this.appendLog(String(chunk))
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    const timeout = setTimeout(() => {
      this.appendLog('安装超时，正在终止…')
      this.cancel()
    }, INSTALL_TIMEOUT_MS)
    timeout.unref?.()
    child.once('error', error => {
      this.appendLog('安装进程错误：' + String(error?.message || error))
      this.state.active = false
      this.state.phase = 'error'
      this.state.error = String(error?.message || error)
      this.state.finishedAt = Date.now()
      clearTimeout(timeout)
    })
    child.once('exit', async code => {
      clearTimeout(timeout)
      this.child = undefined
      this.state.active = false
      this.state.exitCode = code
      this.state.finishedAt = Date.now()
      this.appendLog(code === 0 ? '安装命令完成，正在重新检测 llama-server…' : '安装命令退出码 ' + String(code) + '，仍尝试重新检测 llama-server…')
      const found = await this.manager.findRuntime(true).catch(() => undefined)
      this.state.runtimePath = found || ''
      if (found) {
        this.state.phase = 'done'
        this.state.error = ''
        this.appendLog('已找到 llama-server：' + found)
      } else if (code === 0) {
        this.state.phase = 'error'
        this.state.error = '安装命令已完成，但仍未找到 llama-server。请重启 DSH 以刷新 PATH，或在设置里手动填写 llama-server 路径。'
      } else {
        this.state.phase = 'error'
        this.state.error = '安装命令退出码 ' + String(code) + '，且仍未找到 llama-server。请展开日志查看原因，或手动下载 llama.cpp。'
      }
    })
    return { ...this.state }
  }

  cancel() {
    const child = this.child
    this.child = undefined
    if (child !== undefined && child.exitCode === null) {
      try { child.kill() } catch { /* ignore */ }
      if (process.platform === 'win32' && child.pid !== undefined) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 8000 })
      }
    }
    if (this.state.active) {
      this.state.active = false
      this.state.phase = 'cancelled'
      this.state.error = '安装已取消'
      this.state.finishedAt = Date.now()
    }
    return { ...this.state }
  }

  dispose() {
    this.cancel()
  }
}
