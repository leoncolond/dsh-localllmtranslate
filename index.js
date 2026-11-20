/**
 * Host half of `dsh-localllmtranslate`.
 *
 * - Owns the local Hy-MT2 model download and one lazily started llama-server.
 * - Serves the translation workspace API under `/localllmtranslate`.
 * - Persists glossary and translation history under `$DSH_HOME/localllmtranslate`.
 * - Exposes the `translate_text` agent tool.
 *
 * The bundle is installed into a profile, so it intentionally imports only
 * Node builtins and its own `lib/` modules.
 */

import { stat } from 'node:fs/promises'
import {
  DEFAULT_MODEL,
  LANGUAGES,
  PLUGIN_VERSION,
  ROUTE_PREFIX,
  asString,
  errorText,
  isObject,
  isLanguageCode,
  parseGlossaryImport,
  splitParagraphs,
} from './lib/shared.js'
import { GlossaryStore, HistoryStore, SettingsStore, ensureDirs, pluginPaths } from './lib/store.js'
import { ModelManager } from './lib/model.js'
import { RuntimeInstaller } from './lib/setup.js'
import { extractGlossary, resolvePair, translateSegments, translateText } from './lib/translate.js'

export const name = 'dsh-localllmtranslate'
export const inject = ['tools']

const MAX_BODY_BYTES = 4 * 1024 * 1024
const GLOSSARY_IMPORT_BYTES = 2 * 1024 * 1024

function sendJson(response, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(body)
}

function sendError(response, status, code, message, extra) {
  sendJson(response, status, { ok: false, code, error: message, ...(isObject(extra) ? extra : {}) })
}

function httpError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function rejectionOf(connection, request) {
  if (typeof connection?.requestRejection !== 'function') return 401
  return connection.requestRejection({ headers: request.headers })
}

async function readJsonBody(request, limitBytes = MAX_BODY_BYTES) {
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > limitBytes) throw httpError(413, 'TRANSLATE_BODY_TOO_LARGE', '请求内容太大')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  let value
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw httpError(400, 'TRANSLATE_BAD_JSON', '请求体必须是合法 JSON')
  }
  if (!isObject(value)) throw httpError(400, 'TRANSLATE_BAD_JSON', '请求体必须是 JSON 对象')
  return value
}

function validateLanguage(value, field) {
  if (value === undefined || value === null || value === '') return 'auto'
  if (!isLanguageCode(value)) throw httpError(400, 'TRANSLATE_BAD_LANGUAGE', field + ' 不是支持的语言代码：' + String(value))
  return value
}

function normalizeSegments(body) {
  if (Array.isArray(body.segments)) {
    const segments = body.segments
      .map(segment => asString(segment).trim())
      .filter(segment => segment !== '')
    if (segments.length > 500) throw httpError(400, 'TRANSLATE_TOO_MANY_SEGMENTS', '一次最多 500 段')
    return segments
  }
  return splitParagraphs(asString(body.text))
}

/** Translate one batch and stream progress as Server-Sent Events. */
async function handleTranslateStream(request, response, deps) {
  const body = await readJsonBody(request)
  const segments = normalizeSegments(body)
  if (segments.length === 0) throw httpError(400, 'TRANSLATE_EMPTY', '请先输入要翻译的文本')
  const sourceLang = validateLanguage(body.sourceLang, 'sourceLang')
  const targetLang = validateLanguage(body.targetLang, 'targetLang')
  const settings = await deps.settingsStore.load()

  const controller = new AbortController()
  const onClose = () => {
    if (!response.writableEnded) controller.abort()
  }
  response.once('close', onClose)
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  })
  const send = event => {
    if (response.writableEnded) return
    response.write('data: ' + JSON.stringify(event) + '\n\n')
  }
  try {
    send({ type: 'status', phase: deps.manager.ready ? 'generating' : 'loading' })
    const record = await translateSegments({
      manager: deps.manager,
      settings,
      glossaryStore: deps.glossaryStore,
      segments,
      sourceLang,
      targetLang,
      signal: controller.signal,
      onEvent: send,
    })
    const shouldSave = body.saveHistory !== false && settings.autoSaveHistory
    if (shouldSave) {
      const saved = await deps.historyStore.add(record)
      if (saved !== undefined) {
        send({ type: 'saved', id: saved.id, createdAt: saved.createdAt, title: saved.title })
      }
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      send({
        type: 'error',
        message: errorText(error),
        code: typeof error?.code === 'string' ? error.code : 'TRANSLATE_FAILED',
      })
    }
  } finally {
    response.removeListener('close', onClose)
    if (!response.writableEnded) response.end()
  }
}

function glossaryPayload(store) {
  return {
    ok: true,
    entries: store.entries,
    stats: store.stats(),
    languages: LANGUAGES,
  }
}

async function handleGlossary(request, response, deps, url) {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method === 'GET') {
    await deps.glossaryStore.load()
    if (url.searchParams.get('format') === 'csv') {
      const body = Buffer.from(deps.glossaryStore.toCsv(), 'utf8')
      response.writeHead(200, {
        'content-type': 'text/csv; charset=utf-8',
        'content-length': String(body.length),
        'content-disposition': 'attachment; filename="glossary.csv"',
        'cache-control': 'no-store',
      })
      response.end(body)
      return
    }
    sendJson(response, 200, glossaryPayload(deps.glossaryStore))
    return
  }
  if (method !== 'POST') throw httpError(405, 'TRANSLATE_METHOD', '不支持的请求方法')

  const body = await readJsonBody(request, GLOSSARY_IMPORT_BYTES)
  const action = asString(body.action, 'add')
  if (action === 'add' || action === 'update') {
    const raw = isObject(body.entry) ? body.entry : body
    const defaults = {
      sourceLang: validateLanguage(body.sourceLang, 'sourceLang') === 'auto' ? 'zh' : body.sourceLang,
      targetLang: validateLanguage(body.targetLang, 'targetLang') === 'auto' ? 'en' : body.targetLang,
    }
    if (action === 'update') {
      if (asString(raw.id).trim() === '') throw httpError(400, 'TRANSLATE_BAD_TERM', 'update 需要术语 id')
      const entry = await deps.glossaryStore.update(raw.id, raw)
      sendJson(response, 200, { ok: true, entry })
      return
    }
    const result = await deps.glossaryStore.add(raw, defaults)
    sendJson(response, 200, { ok: true, ...result })
    return
  }
  if (action === 'delete' || action === 'reject') {
    const removed = await deps.glossaryStore.remove(asString(body.id))
    sendJson(response, 200, { ok: true, removed })
    return
  }
  if (action === 'approve') {
    const entry = await deps.glossaryStore.approve(asString(body.id))
    sendJson(response, 200, { ok: true, entry })
    return
  }
  if (action === 'clear-pending') {
    const removed = await deps.glossaryStore.clearPending()
    sendJson(response, 200, { ok: true, removed })
    return
  }
  if (action === 'import') {
    const rows = parseGlossaryImport(asString(body.text), asString(body.format, 'csv'))
    const scope = body.scope === 'global' ? 'global' : 'pair'
    const sourceLang = validateLanguage(body.sourceLang, 'sourceLang') === 'auto' ? 'zh' : body.sourceLang
    const targetLang = validateLanguage(body.targetLang, 'targetLang') === 'auto' ? 'en' : body.targetLang
    const result = await deps.glossaryStore.addMany(rows, {
      scope,
      sourceLang,
      targetLang,
      status: body.status === 'pending' ? 'pending' : 'active',
    })
    sendJson(response, 200, { ok: true, added: result.added, skipped: result.skipped })
    return
  }
  throw httpError(400, 'TRANSLATE_BAD_ACTION', '未知的术语操作：' + action)
}

async function handleHistory(request, response, deps, url) {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method === 'GET') {
    await deps.historyStore.load()
    const id = url.searchParams.get('id')
    if (id !== null && id !== '') {
      const record = deps.historyStore.get(id)
      if (record === undefined) throw httpError(404, 'TRANSLATE_HISTORY_MISSING', '这条历史记录已不存在')
      sendJson(response, 200, { ok: true, record })
      return
    }
    sendJson(response, 200, {
      ok: true,
      records: deps.historyStore.summary(),
      total: deps.historyStore.records.length,
    })
    return
  }
  if (method !== 'POST') throw httpError(405, 'TRANSLATE_METHOD', '不支持的请求方法')
  const body = await readJsonBody(request)
  const action = asString(body.action, 'delete')
  if (action === 'save') {
    await deps.settingsStore.load()
    const saved = await deps.historyStore.add(isObject(body.record) ? body.record : body)
    if (saved === undefined) throw httpError(400, 'TRANSLATE_HISTORY_EMPTY', '没有可保存的译文')
    sendJson(response, 200, {
      ok: true,
      record: { id: saved.id, title: saved.title, createdAt: saved.createdAt },
    })
    return
  }
  if (action === 'delete') {
    const removed = await deps.historyStore.remove(asString(body.id))
    sendJson(response, 200, { ok: true, removed })
    return
  }
  if (action === 'clear') {
    const removed = await deps.historyStore.clear()
    sendJson(response, 200, { ok: true, removed })
    return
  }
  throw httpError(400, 'TRANSLATE_BAD_ACTION', '未知的历史操作：' + action)
}

async function handleModel(request, response, deps, url) {
  const method = (request.method ?? 'GET').toUpperCase()
  const action = url.searchParams.get('action') ?? ''
  if (method === 'GET') {
    if (action === 'diagnostics') {
      sendJson(response, 200, { ok: true, ...(await deps.manager.diagnostics()) })
      return
    }
    sendJson(response, 200, { ok: true, ...(await deps.manager.status()) })
    return
  }
  if (method !== 'POST') throw httpError(405, 'TRANSLATE_METHOD', '不支持的请求方法')
  if (action === 'download') {
    const started = await deps.manager.startDownload()
    sendJson(response, 200, { ok: true, download: started })
    return
  }
  if (action === 'cancel-download') {
    sendJson(response, 200, { ok: true, download: deps.manager.cancelDownload() })
    return
  }
  if (action === 'start') {
    await deps.manager.ensureReady()
    sendJson(response, 200, { ok: true, ...(await deps.manager.status()) })
    return
  }
  if (action === 'stop') {
    await deps.manager.stop('manual')
    sendJson(response, 200, { ok: true, ...(await deps.manager.status()) })
    return
  }
  if (action === 'rescan') {
    deps.manager.modelCache = { at: 0, items: [] }
    await deps.manager.listModels(true)
    await deps.manager.findRuntime(true)
    sendJson(response, 200, { ok: true, ...(await deps.manager.status()) })
    return
  }
  throw httpError(400, 'TRANSLATE_BAD_ACTION', '未知的模型操作：' + action)
}

function publicSettings(settings) {
  return {
    port: settings.port,
    ctxSize: settings.ctxSize,
    gpuLayers: settings.gpuLayers,
    idleUnloadMinutes: settings.idleUnloadMinutes,
    sidebarSide: settings.sidebarSide,
    toastEnabled: settings.toastEnabled,
    modelStatusDoubleClick: settings.modelStatusDoubleClick,
    layoutOrientation: settings.layoutOrientation,
    autoDownloadModel: settings.autoDownloadModel,
    autoStartModel: settings.autoStartModel,
    autoExtractGlossary: settings.autoExtractGlossary,
    autoSaveHistory: settings.autoSaveHistory,
    maxHistory: settings.maxHistory,
    maxTermsPerSegment: settings.maxTermsPerSegment,
    temperature: settings.temperature,
    topP: settings.topP,
    topK: settings.topK,
    repeatPenalty: settings.repeatPenalty,
    maxTokens: settings.maxTokens,
    overrideEos: settings.overrideEos,
    extraArgs: settings.extraArgs,
    llamaServerPath: settings.llamaServerPath,
    downloadUrl: settings.downloadUrl,
    downloadName: settings.downloadName,
  }
}

async function buildState(deps) {
  const settings = await deps.settingsStore.load()
  await Promise.all([deps.glossaryStore.load(), deps.historyStore.load()])
  const [model, runtime, models] = await Promise.all([
    deps.manager.resolveModel(),
    deps.manager.findRuntime(),
    deps.manager.listModels(),
  ])
  const modelInfo = model === undefined
    ? { found: false, path: '', name: '', bytes: 0 }
    : { found: true, path: model.path, name: model.name, bytes: 0 }
  if (model !== undefined) {
    modelInfo.bytes = (await stat(model.path).catch(() => undefined))?.size ?? 0
  }
  return {
    ok: true,
    version: PLUGIN_VERSION,
    features: { saveHistory: true, saveHistoryFlag: true },
    setup: { ...deps.installer.info() },
    settings: publicSettings(settings),
    languages: LANGUAGES,
    model: {
      phase: deps.manager.phase,
      ready: deps.manager.ready,
      starting: deps.manager.startPromise !== undefined,
      error: deps.manager.error,
      port: deps.manager.port,
      pid: deps.manager.child?.pid ?? 0,
      host: '127.0.0.1',
      model: modelInfo,
      runtime: { found: runtime !== undefined, path: runtime ?? '' },
      models,
      download: { ...deps.manager.download },
      lastUsedAt: deps.manager.lastUsedAt,
      idleUnloadMinutes: settings.idleUnloadMinutes,
      candidateUrl: settings.downloadUrl,
      candidateName: settings.downloadName,
      expectedBytes: DEFAULT_MODEL.size,
    },
    glossary: deps.glossaryStore.stats(),
    history: {
      total: deps.historyStore.records.length,
      records: deps.historyStore.summary().slice(0, 30),
    },
    paths: {
      modelsDir: deps.paths.modelsDir,
      stateDir: deps.paths.stateDir,
    },
  }
}

async function handleSettings(request, response, deps) {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method === 'GET') {
    const settings = await deps.settingsStore.load()
    sendJson(response, 200, { ok: true, settings: publicSettings(settings) })
    return
  }
  if (method !== 'POST') throw httpError(405, 'TRANSLATE_METHOD', '不支持的请求方法')
  const body = await readJsonBody(request)
  const previous = await deps.settingsStore.load()
  const wasReady = deps.manager.ready
  const next = await deps.settingsStore.update(isObject(body.settings) ? body.settings : body)
  const launchChanged = SettingsStore.launchChanged(previous, next)
  if (launchChanged && (deps.manager.ready || deps.manager.child !== undefined)) {
    await deps.manager.stop('settings')
  }
  sendJson(response, 200, {
    ok: true,
    settings: publicSettings(next),
    restartRequired: launchChanged && wasReady,
  })
}

function createHttpHandler(deps) {
  return async function handle(request, response) {
    try {
      const connection = deps.ctx.get('connection')
      if (connection === undefined) {
        sendError(response, 401, 'TRANSLATE_UNAVAILABLE', 'Harness 连接服务不可用')
        return
      }
      const rejection = rejectionOf(connection, request)
      if (rejection !== undefined && rejection !== 0) {
        sendError(response, rejection, 'TRANSLATE_UNAUTHORIZED', '请求未通过 Harness 连接信任检查')
        return
      }
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      const path = url.pathname.startsWith(ROUTE_PREFIX)
        ? url.pathname.slice(ROUTE_PREFIX.length)
        : url.pathname
      const method = (request.method ?? 'GET').toUpperCase()

      if (path === '/api/state' && method === 'GET') {
        sendJson(response, 200, await buildState(deps))
        return
      }
      if (path === '/api/settings') {
        await handleSettings(request, response, deps)
        return
      }
      if (path === '/api/setup') {
        if (method === 'GET') {
          sendJson(response, 200, { ok: true, ...deps.installer.info() })
          return
        }
        if (method === 'POST' && url.searchParams.get('action') === 'cancel') {
          sendJson(response, 200, { ok: true, install: deps.installer.cancel(), ...deps.installer.info() })
          return
        }
        throw httpError(405, 'TRANSLATE_METHOD', '不支持的请求方法')
      }
      if (path === '/api/setup/install' && method === 'POST') {
        try {
          const install = await deps.installer.start()
          sendJson(response, 200, { ok: true, install, ...deps.installer.info() })
        } catch (error) {
          sendJson(response, 200, {
            ok: false,
            code: 'TRANSLATE_SETUP_FAILED',
            error: errorText(error),
            ...deps.installer.info(),
          })
        }
        return
      }
      if (path === '/api/model') {
        await handleModel(request, response, deps, url)
        return
      }
      if (path === '/api/glossary') {
        await handleGlossary(request, response, deps, url)
        return
      }
      if (path === '/api/history') {
        await handleHistory(request, response, deps, url)
        return
      }
      if (path === '/api/extract' && method === 'POST') {
        const body = await readJsonBody(request)
        const settings = await deps.settingsStore.load()
        const pairs = Array.isArray(body.pairs) ? body.pairs : []
        const joined = pairs.map(pair => asString(pair?.source)).join('\n')
        const declaredSource = validateLanguage(body.sourceLang, 'sourceLang')
        const declaredTarget = validateLanguage(body.targetLang, 'targetLang')
        const pair = resolvePair(declaredSource, declaredTarget, joined)
        const result = await extractGlossary({
          manager: deps.manager,
          settings,
          glossaryStore: deps.glossaryStore,
          pairs,
          sourceLang: pair.source,
          targetLang: pair.target,
        })
        sendJson(response, 200, { ok: true, ...result })
        return
      }
      if (path === '/api/translate' && method === 'POST') {
        await handleTranslateStream(request, response, deps)
        return
      }
      sendError(response, 404, 'TRANSLATE_NOT_FOUND', '未知的翻译插件路由')
    } catch (error) {
      const status = typeof error === 'object' && error !== null && typeof error.status === 'number'
        ? error.status
        : 500
      const code = typeof error === 'object' && error !== null && typeof error.code === 'string'
        ? error.code
        : 'TRANSLATE_ERROR'
      if (!response.headersSent) {
        sendError(response, status >= 400 && status <= 599 ? status : 500, code, errorText(error))
      } else if (!response.writableEnded) {
        response.end()
      }
    }
  }
}

function buildTool({ manager, settingsStore, glossaryStore, historyStore }) {
  return {
    name: 'translate_text',
    description:
      'Translate text with the local Hy-MT2-1.8B model through the "翻译" workspace. Use it when the user asks for '
      + 'offline/private translation, wants glossary-consistent wording, or asks to translate a paragraph, document '
      + 'excerpt or subtitle. The text is split into paragraphs and translated one paragraph at a time; the result '
      + 'keeps the same paragraph order and can be shown paragraph by paragraph. Translation runs on this machine, '
      + 'never on a cloud API. The first call may download a model or load it, so allow up to a few minutes. '
      + 'If the model is not set up, tell the user to open the "翻译" entry in the left sidebar and download the model there.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'Text to translate. Prefer paragraph breaks (blank lines) so the output keeps the same structure.',
        },
        target_language: {
          type: 'string',
          enum: ['auto', ...LANGUAGES.map(language => language.code)],
          description: 'Target language code. "auto" translates Chinese to English and any other language to Chinese.',
        },
        source_language: {
          type: 'string',
          enum: ['auto', ...LANGUAGES.map(language => language.code)],
          description: 'Source language code; "auto" detects it from the text.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['translation', 'source_language', 'target_language', 'paragraphs'],
        properties: {
          translation: { type: 'string', description: 'Full translation, paragraphs joined with a blank line.' },
          source_language: { type: 'string', description: 'Resolved source language code.' },
          target_language: { type: 'string', description: 'Resolved target language code.' },
          paragraphs: {
            type: 'array',
            description: 'One entry per source paragraph, in order.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string' },
                target: { type: 'string' },
              },
            },
          },
          glossary_terms: {
            type: 'array',
            description: 'Terms that were injected from the glossary for this translation.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string' },
                target: { type: 'string' },
              },
            },
          },
          history_id: { type: 'string', description: 'Id of the saved history record, when history is on.' },
          model: { type: 'string' },
        },
      },
      render: (_args, value) => {
        const paragraphs = Array.isArray(value.paragraphs) ? value.paragraphs : []
        const lines = [
          'Translated ' + String(value.source_language ?? '') + ' → ' + String(value.target_language ?? '')
            + ' with ' + String(value.model ?? 'Hy-MT2-1.8B') + ' (' + paragraphs.length + ' paragraph(s)).',
          '',
          String(value.translation ?? ''),
        ]
        if (Array.isArray(value.glossary_terms) && value.glossary_terms.length > 0) {
          lines.push('', 'Glossary terms used: ' + value.glossary_terms.map(term => term.source + '→' + term.target).join(', '))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(args, exec) {
      const text = asString(args?.text).trim()
      if (text === '') throw new Error('text must be a non-empty string')
      const settings = await settingsStore.load()
      if (settings.autoSaveHistory) await historyStore.load()
      const segments = splitParagraphs(text)
      if (segments.length === 0) throw new Error('text must contain at least one non-empty paragraph')
      const result = await translateText({
        manager,
        settings,
        glossaryStore,
        segments,
        sourceLang: asString(args?.source_language, 'auto'),
        targetLang: asString(args?.target_language, 'auto'),
        signal: exec?.signal,
      })
      let historyId = ''
      if (settings.autoSaveHistory) {
        const saved = await historyStore.add(result.record)
        if (saved !== undefined) historyId = saved.id
      }
      return {
        translation: result.translation,
        source_language: result.record.sourceLang,
        target_language: result.record.targetLang,
        paragraphs: result.record.segments,
        glossary_terms: result.record.glossaryUsed.map(term => ({ source: term.source, target: term.target })),
        history_id: historyId,
        model: 'Hy-MT2-1.8B',
      }
    },
    presentCall(args) {
      const text = asString(args?.text).trim()
      return {
        card: 'generic',
        title: '本地翻译：' + (text === '' ? '未命名文本' : text.slice(0, 50)),
        kind: 'other',
        rawInput: {
          target_language: args?.target_language,
          source_language: args?.source_language,
          characters: text.length,
        },
      }
    },
  }
}

export function apply(ctx) {
  const paths = pluginPaths()
  const settingsStore = new SettingsStore(paths)
  const glossaryStore = new GlossaryStore(paths)
  const historyStore = new HistoryStore(paths, settingsStore)
  const manager = new ModelManager(paths, settingsStore)
  const installer = new RuntimeInstaller(paths, manager)
  const deps = { ctx, paths, settingsStore, glossaryStore, historyStore, manager, installer }

  ensureDirs(paths).catch(() => {})

  ctx.effect(() => {
    let disposed = false
    return () => {
      if (disposed) return
      disposed = true
      manager.dispose().catch(() => {})
      installer.dispose()
    }
  }, 'dsh-localllmtranslate: llama-server lifecycle')

  ctx.effect(() => ctx.tools.register(buildTool(deps)), 'dsh-localllmtranslate: translate_text tool')

  ctx.inject(['webServer', 'connection'], routeCtx => {
    const webServer = routeCtx.webServer
    if (webServer === undefined || typeof webServer.register !== 'function') return
    routeCtx.effect(
      () => webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: createHttpHandler(deps) }),
      'dsh-localllmtranslate: workspace routes',
    )
  })
}












