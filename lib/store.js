/**
 * Durable, plugin-owned state for `dsh-localllmtranslate`.
 *
 * Everything lives under `$DSH_HOME/localllmtranslate/` as plain JSON files so
 * the panel, the agent tool and a restart all read the same facts. Writes are
 * atomic (temp file + rename) to survive a crash mid-save.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile, access } from 'node:fs/promises'
import { constants as FS } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { DEFAULT_MODEL, DEFAULT_SETTINGS, asString, isObject, normalizeSettings } from './shared.js'

export function dshHome(env = process.env) {
  const raw = asString(env.DSH_HOME).trim()
  if (raw === '') return resolve(join(homedir(), '.dsh'))
  return resolve(raw.replace(/^~(?=$|[\\/])/, homedir()))
}

export function pluginPaths(env = process.env) {
  const home = dshHome(env)
  const root = join(home, 'localllmtranslate')
  const stateDir = join(root, 'state')
  return {
    home,
    root,
    modelsDir: join(root, 'models'),
    stateDir,
    settingsFile: join(stateDir, 'settings.json'),
    glossaryFile: join(stateDir, 'glossary.json'),
    historyFile: join(stateDir, 'history.json'),
    logFile: join(stateDir, 'llama-server.log'),
    modelPartFile: join(root, 'models', DEFAULT_MODEL.name + '.part'),
  }
}

async function exists(file) {
  try {
    await access(file, FS.F_OK)
    return true
  } catch {
    return false
  }
}

export async function ensureDirs(paths) {
  await Promise.all([
    mkdir(paths.modelsDir, { recursive: true }),
    mkdir(paths.stateDir, { recursive: true }),
  ])
  const hint = join(paths.modelsDir, '把 Hy-MT2 模型放在这里.txt')
  if (!(await exists(hint))) {
    await writeFile(
      hint,
      '把 Hy-MT2 的 GGUF 模型放在这个目录（默认 Hy-MT2-1.8B.f16.gguf）。\n'
      + '也可以在「翻译 → 设置」里点「下载模型」，插件会自动下载 F16 版本到这里。\n',
      'utf8',
    )
  }
}

async function readJson(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8')
    if (raw.trim() === '') return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true })
  const temporary = file + '.tmp-' + process.pid + '-' + Date.now()
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', 'utf8')
  await rename(temporary, file)
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

export class SettingsStore {
  constructor(paths) {
    this.paths = paths
    this.value = { ...DEFAULT_SETTINGS }
    this.loaded = false
  }

  async load() {
    if (this.loaded) return this.value
    await ensureDirs(this.paths)
    const raw = await readJson(this.paths.settingsFile, {})
    const values = isObject(raw?.values) ? raw.values : raw
    this.value = normalizeSettings(isObject(values) ? values : {})
    this.loaded = true
    return this.value
  }

  async update(patch) {
    await this.load()
    const next = normalizeSettings({ ...this.value, ...(isObject(patch) ? patch : {}) })
    this.value = next
    await writeJson(this.paths.settingsFile, { version: 1, updatedAt: Date.now(), values: next })
    return next
  }

  /** Launch parameters that require a llama-server restart when changed. */
  static launchChanged(previous, next) {
    const keys = ['modelFile', 'llamaServerPath', 'port', 'ctxSize', 'gpuLayers', 'overrideEos', 'extraArgs']
    return keys.some(key => previous?.[key] !== next?.[key])
  }
}

/* ------------------------------------------------------------------ */
/* Glossary                                                           */
/* ------------------------------------------------------------------ */

const GLOSSARY_VERSION = 1

function normalizeEntry(raw, defaults = {}) {
  const source = asString(raw?.source).trim()
  const target = asString(raw?.target).trim()
  if (source === '' || target === '') return undefined
  const scope = raw?.scope === 'global' ? 'global' : 'pair'
  const sourceLang = asString(raw?.sourceLang, defaults.sourceLang ?? 'zh').trim() || 'zh'
  const targetLang = asString(raw?.targetLang, defaults.targetLang ?? 'en').trim() || 'en'
  const status = raw?.status === 'pending' ? 'pending' : 'active'
  const now = Date.now()
  return {
    id: asString(raw?.id).trim() || 'term-' + randomUUID(),
    source,
    target,
    scope,
    sourceLang: scope === 'global' ? '*' : sourceLang,
    targetLang: scope === 'global' ? '*' : targetLang,
    status,
    note: asString(raw?.note).slice(0, 300),
    hits: Number.isFinite(Number(raw?.hits)) ? Math.max(0, Math.trunc(Number(raw.hits))) : 0,
    createdAt: Number.isFinite(Number(raw?.createdAt)) ? Number(raw.createdAt) : now,
    updatedAt: now,
  }
}

function entryKey(entry) {
  return [entry.scope, entry.sourceLang, entry.targetLang, entry.source.toLowerCase()].join('|')
}

export class GlossaryStore {
  constructor(paths) {
    this.paths = paths
    this.entries = []
    this.loaded = false
  }

  async load() {
    if (this.loaded) return this.entries
    const raw = await readJson(this.paths.glossaryFile, {})
    const entries = Array.isArray(raw?.entries) ? raw.entries : []
    const seen = new Set()
    this.entries = []
    for (const item of entries) {
      const entry = normalizeEntry(item)
      if (entry === undefined) continue
      const key = entryKey(entry)
      if (seen.has(key)) continue
      seen.add(key)
      this.entries.push(entry)
    }
    this.loaded = true
    return this.entries
  }

  async save() {
    await writeJson(this.paths.glossaryFile, {
      version: GLOSSARY_VERSION,
      updatedAt: Date.now(),
      entries: this.entries,
    })
  }

  async list() {
    await this.load()
    return this.entries
  }

  /** Active terms that apply to one language pair, plus global terms. */
  async termsFor(sourceLang, targetLang) {
    await this.load()
    return this.entries.filter(entry => entry.status === 'active' && (
      entry.scope === 'global'
      || (entry.sourceLang === sourceLang && entry.targetLang === targetLang)
    ))
  }

  stats() {
    const active = this.entries.filter(entry => entry.status === 'active').length
    const pending = this.entries.filter(entry => entry.status === 'pending').length
    const pairs = new Set()
    for (const entry of this.entries) {
      if (entry.scope === 'pair') pairs.add(entry.sourceLang + '>' + entry.targetLang)
    }
    return { total: this.entries.length, active, pending, pairs: pairs.size }
  }

  async add(raw, defaults) {
    await this.load()
    const entry = normalizeEntry(raw, defaults)
    if (entry === undefined) throw new Error('原文和译文都不能为空')
    const key = entryKey(entry)
    const duplicate = this.entries.find(item => entryKey(item) === key)
    if (duplicate !== undefined) {
      duplicate.target = entry.target
      duplicate.note = entry.note || duplicate.note
      duplicate.status = entry.status === 'active' ? 'active' : duplicate.status
      duplicate.updatedAt = Date.now()
      await this.save()
      return { entry: duplicate, created: false }
    }
    this.entries.unshift(entry)
    await this.save()
    return { entry, created: true }
  }

  async addMany(rows, defaults) {
    await this.load()
    const seen = new Set(this.entries.map(entryKey))
    let added = 0
    let skipped = 0
    const created = []
    for (const row of rows) {
      const entry = normalizeEntry({ ...defaults, ...row }, defaults)
      if (entry === undefined) {
        skipped += 1
        continue
      }
      const key = entryKey(entry)
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      this.entries.unshift(entry)
      created.push(entry)
      added += 1
      if (added >= 5000) break
    }
    if (added > 0) await this.save()
    return { added, skipped, entries: created }
  }

  async update(id, patch) {
    await this.load()
    const entry = this.entries.find(item => item.id === id)
    if (entry === undefined) throw new Error('术语不存在或已被删除')
    const next = normalizeEntry({ ...entry, ...patch, id: entry.id, createdAt: entry.createdAt })
    if (next === undefined) throw new Error('原文和译文都不能为空')
    Object.assign(entry, next)
    await this.save()
    return entry
  }

  async remove(id) {
    await this.load()
    const before = this.entries.length
    this.entries = this.entries.filter(entry => entry.id !== id)
    if (this.entries.length !== before) await this.save()
    return before - this.entries.length
  }

  async approve(id) {
    return this.update(id, { status: 'active' })
  }

  async reject(id) {
    return this.remove(id)
  }

  async clearPending() {
    await this.load()
    const before = this.entries.length
    this.entries = this.entries.filter(entry => entry.status !== 'pending')
    if (this.entries.length !== before) await this.save()
    return before - this.entries.length
  }

  /** Record that these terms were used in a translation. */
  async markUsed(ids) {
    await this.load()
    if (!Array.isArray(ids) || ids.length === 0) return
    const wanted = new Set(ids)
    for (const entry of this.entries) {
      if (wanted.has(entry.id)) entry.hits += 1
    }
    await this.save()
  }

  toCsv() {
    const header = 'source,target,source_lang,target_lang,scope,note,status'
    const lines = [header]
    for (const entry of this.entries) {
      const cells = [
        entry.source,
        entry.target,
        entry.sourceLang,
        entry.targetLang,
        entry.scope,
        entry.note,
        entry.status,
      ].map(value => {
        const text = String(value ?? '')
        return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
      })
      lines.push(cells.join(','))
    }
    return lines.join('\n') + '\n'
  }
}

/* ------------------------------------------------------------------ */
/* History                                                            */
/* ------------------------------------------------------------------ */

const HISTORY_VERSION = 1

/**
 * `history.json` is rewritten in full on every saved translation, so the file
 * needs a byte budget as well as a record-count limit: 200 long documents can
 * otherwise grow into tens of megabytes that are re-serialized each time.
 */
const HISTORY_MAX_BYTES = 8 * 1024 * 1024

function recordBytes(record) {
  try {
    return Buffer.byteLength(JSON.stringify(record), 'utf8')
  } catch {
    return 0
  }
}

export class HistoryStore {
  constructor(paths, settings) {
    this.paths = paths
    this.settings = settings
    this.records = []
    this.loaded = false
  }

  async load() {
    if (this.loaded) return this.records
    const raw = await readJson(this.paths.historyFile, {})
    const records = Array.isArray(raw?.records) ? raw.records : []
    this.records = records.filter(record => isObject(record) && Array.isArray(record.segments)).slice(0, 2000)
    this.loaded = true
    return this.records
  }

  async save() {
    const limit = this.settings.value.maxHistory || 200
    // Records are newest-first, so dropping from the tail keeps the newest.
    while (this.records.length > limit) this.records.pop()
    let total = 0
    for (const record of this.records) total += recordBytes(record)
    // A single oversized record is still kept: losing the translation the user
    // just asked to save would be worse than one large file.
    while (total > HISTORY_MAX_BYTES && this.records.length > 1) {
      total -= recordBytes(this.records.pop())
    }
    await writeJson(this.paths.historyFile, {
      version: HISTORY_VERSION,
      updatedAt: Date.now(),
      records: this.records,
    })
  }

  async add(record) {
    await this.load()
    const segments = Array.isArray(record.segments)
      ? record.segments
        .map(segment => ({
          source: asString(segment?.source),
          target: asString(segment?.target),
        }))
        .filter(segment => segment.source !== '' || segment.target !== '')
      : []
    if (segments.length === 0) return undefined
    const first = segments.find(segment => segment.source !== '')?.source ?? ''
    const entry = {
      id: 'tr-' + randomUUID(),
      createdAt: Date.now(),
      title: asString(record.title).trim() || first.replace(/\s+/g, ' ').slice(0, 42) || '未命名翻译',
      sourceLang: asString(record.sourceLang, 'auto'),
      targetLang: asString(record.targetLang, 'zh'),
      segments,
      glossaryUsed: Array.isArray(record.glossaryUsed) ? record.glossaryUsed.slice(0, 60) : [],
      chars: segments.reduce((total, segment) => total + segment.source.length, 0),
      model: asString(record.model, 'Hy-MT2-1.8B'),
    }
    this.records.unshift(entry)
    await this.save()
    return entry
  }

  summary() {
    return this.records.map(record => ({
      id: record.id,
      createdAt: record.createdAt,
      title: record.title,
      sourceLang: record.sourceLang,
      targetLang: record.targetLang,
      chars: record.chars,
      segmentCount: Array.isArray(record.segments) ? record.segments.length : 0,
    }))
  }

  get(id) {
    return this.records.find(record => record.id === id)
  }

  async remove(id) {
    await this.load()
    const before = this.records.length
    this.records = this.records.filter(record => record.id !== id)
    if (this.records.length !== before) await this.save()
    return before - this.records.length
  }

  async clear() {
    await this.load()
    const count = this.records.length
    this.records = []
    await this.save()
    return count
  }
}

export { readJson, writeJson }
