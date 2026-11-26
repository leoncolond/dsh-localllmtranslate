/**
 * Shared, dependency-free helpers for `dsh-localllmtranslate`.
 *
 * The plugin is installed as a profile bundle, so it cannot resolve Harness
 * packages or third-party modules; everything here uses Node builtins only.
 */

export const ROUTE_PREFIX = '/localllmtranslate'
export const PLUGIN_VERSION = '0.1.2'

export const DEFAULT_MODEL = {
  name: 'Hy-MT2-1.8B.f16.gguf',
  url: 'https://hf-mirror.com/mradermacher/Hy-MT2-1.8B-GGUF/resolve/main/Hy-MT2-1.8B.f16.gguf',
  size: 3587534560,
  label: 'Hy-MT2-1.8B · F16',
}

/** Languages published by the Hy-MT2 model card (Chinese prompt names). */
export const LANGUAGES = [
  { code: 'zh', name: '中文' },
  { code: 'zh-Hant', name: '繁体中文' },
  { code: 'yue', name: '粤语' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'it', name: '意大利语' },
  { code: 'nl', name: '荷兰语' },
  { code: 'pl', name: '波兰语' },
  { code: 'cs', name: '捷克语' },
  { code: 'ru', name: '俄语' },
  { code: 'uk', name: '乌克兰语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'fa', name: '波斯语' },
  { code: 'he', name: '希伯来语' },
  { code: 'hi', name: '印地语' },
  { code: 'bn', name: '孟加拉语' },
  { code: 'gu', name: '古吉拉特语' },
  { code: 'mr', name: '马拉地语' },
  { code: 'te', name: '泰卢固语' },
  { code: 'ta', name: '泰米尔语' },
  { code: 'ur', name: '乌尔都语' },
  { code: 'th', name: '泰语' },
  { code: 'vi', name: '越南语' },
  { code: 'ms', name: '马来语' },
  { code: 'id', name: '印尼语' },
  { code: 'tl', name: '菲律宾语' },
  { code: 'km', name: '高棉语' },
  { code: 'my', name: '缅甸语' },
  { code: 'bo', name: '藏语' },
  { code: 'kk', name: '哈萨克语' },
  { code: 'mn', name: '蒙古语' },
  { code: 'ug', name: '维吾尔语' },
]

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map(entry => [entry.code, entry]))

export function languageName(code) {
  return LANGUAGE_BY_CODE.get(code)?.name ?? '中文'
}

export function isLanguageCode(code) {
  return code === 'auto' || LANGUAGE_BY_CODE.has(code)
}

export const DEFAULT_SETTINGS = {
  modelFile: '',
  llamaServerPath: '',
  port: 18081,
  ctxSize: 8192,
  gpuLayers: 99,
  idleUnloadMinutes: 10,
  sidebarSide: 'right',
  toastEnabled: true,
  modelStatusDoubleClick: true,
  layoutOrientation: 'horizontal',
  autoDownloadModel: true,
  autoStartModel: true,
  autoExtractGlossary: true,
  autoSaveHistory: true,
  maxHistory: 200,
  maxTermsPerSegment: 24,
  temperature: 0.7,
  topP: 0.6,
  topK: 20,
  repeatPenalty: 1.05,
  maxTokens: 4096,
  overrideEos: true,
  extraArgs: '',
  downloadUrl: DEFAULT_MODEL.url,
  downloadName: DEFAULT_MODEL.name,
}

export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

export function clampInt(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

export function clampFloat(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

/** Normalize saved settings over the defaults, dropping keys we do not own. */
export function normalizeSettings(raw) {
  const input = isObject(raw) ? raw : {}
  const settings = { ...DEFAULT_SETTINGS }
  settings.modelFile = asString(input.modelFile).trim()
  settings.llamaServerPath = asString(input.llamaServerPath).trim()
  settings.port = clampInt(input.port, 1024, 65535, DEFAULT_SETTINGS.port)
  settings.ctxSize = clampInt(input.ctxSize, 2048, 65536, DEFAULT_SETTINGS.ctxSize)
  settings.gpuLayers = clampInt(input.gpuLayers, 0, 999, DEFAULT_SETTINGS.gpuLayers)
  settings.idleUnloadMinutes = clampInt(input.idleUnloadMinutes, 0, 240, DEFAULT_SETTINGS.idleUnloadMinutes)
  settings.sidebarSide = input.sidebarSide === 'left' ? 'left' : 'right'
  settings.toastEnabled = input.toastEnabled !== false
  settings.modelStatusDoubleClick = input.modelStatusDoubleClick !== false
  settings.layoutOrientation = input.layoutOrientation === 'vertical' ? 'vertical' : 'horizontal'
  settings.autoDownloadModel = input.autoDownloadModel !== false
  settings.autoStartModel = input.autoStartModel !== false
  settings.autoExtractGlossary = input.autoExtractGlossary !== false
  settings.autoSaveHistory = input.autoSaveHistory !== false
  settings.maxHistory = clampInt(input.maxHistory, 10, 2000, DEFAULT_SETTINGS.maxHistory)
  settings.maxTermsPerSegment = clampInt(input.maxTermsPerSegment, 0, 60, DEFAULT_SETTINGS.maxTermsPerSegment)
  settings.temperature = clampFloat(input.temperature, 0, 2, DEFAULT_SETTINGS.temperature)
  settings.topP = clampFloat(input.topP, 0, 1, DEFAULT_SETTINGS.topP)
  settings.topK = clampInt(input.topK, 0, 200, DEFAULT_SETTINGS.topK)
  settings.repeatPenalty = clampFloat(input.repeatPenalty, 0.8, 2, DEFAULT_SETTINGS.repeatPenalty)
  settings.maxTokens = clampInt(input.maxTokens, 64, 16384, DEFAULT_SETTINGS.maxTokens)
  settings.overrideEos = input.overrideEos !== false
  settings.extraArgs = asString(input.extraArgs).slice(0, 2000)
  settings.downloadUrl = asString(input.downloadUrl, DEFAULT_SETTINGS.downloadUrl).trim() || DEFAULT_SETTINGS.downloadUrl
  settings.downloadName = asString(input.downloadName, DEFAULT_SETTINGS.downloadName).trim() || DEFAULT_SETTINGS.downloadName
  return settings
}

/**
 * Split text into paragraph-sized translation units.
 *
 * Blank lines are the primary boundary; a block without blank lines but with
 * several short lines (subtitles, lists) is split per line. Oversized blocks
 * are then split on sentence boundaries so one segment never blows the model
 * context, and the pieces are still rendered as one aligned paragraph.
 */
export function splitParagraphs(text, options = {}) {
  const limit = options.limit ?? 1400
  const normalized = String(text ?? '').replace(/\r\n?/g, '\n').trim()
  if (normalized === '') return []
  let blocks = normalized.split(/\n[ \t]*\n+/).map(part => part.trim()).filter(Boolean)
  if (blocks.length === 1) {
    const lines = normalized.split('\n').map(part => part.trim()).filter(Boolean)
    if (lines.length > 1 && lines.every(line => line.length <= 300)) blocks = lines
  }
  const segments = []
  for (const block of blocks) {
    for (const piece of splitLongBlock(block, limit)) segments.push(piece)
  }
  return segments
}

/** Split one oversized block at sentence enders, keeping every character. */
export function splitLongBlock(block, limit) {
  const text = String(block)
  if (text.length <= limit) return [text]
  const pieces = []
  let rest = text
  while (rest.length > limit) {
    const windowText = rest.slice(0, limit)
    const boundary = lastSentenceBoundary(windowText)
    if (boundary <= 0) {
      pieces.push(windowText)
      rest = rest.slice(limit)
      continue
    }
    pieces.push(rest.slice(0, boundary))
    rest = rest.slice(boundary)
  }
  if (rest.trim() !== '') pieces.push(rest)
  return pieces.map(piece => piece.trim()).filter(Boolean)
}

function lastSentenceBoundary(text) {
  const pattern = /[。！？!?；;…](?:[”』」）)]*)?/g
  let last = -1
  let match
  while ((match = pattern.exec(text)) !== null) {
    last = match.index + match[0].length
    if (last >= text.length * 0.5) return last
  }
  const newline = text.lastIndexOf('\n')
  if (newline > 0) return newline
  return last
}

/**
 * Heuristic language detection. Chinese/Japanese/Korean scripts are decisive;
 * Latin and Cyrillic text use frequent function words. `auto` falls back to en.
 */
export function detectLanguage(text) {
  const sample = String(text ?? '').slice(0, 4000)
  if (sample.trim() === '') return 'en'
  const has = pattern => pattern.test(sample)
  if (has(/[\u3040-\u30ff]/)) return 'ja'
  if (has(/[\uac00-\ud7af\u1100-\u11ff]/)) return 'ko'
  if (has(/[\u0e00-\u0e7f]/)) return 'th'
  if (has(/[\u1780-\u17ff]/)) return 'km'
  if (has(/[\u1000-\u109f]/)) return 'my'
  if (has(/[\u0f00-\u0fff]/)) return 'bo'
  if (has(/[\u0590-\u05ff]/)) return 'he'
  if (has(/[\u0600-\u06ff]/)) {
    if (/[\u06a9\u06af\u067e\u0686\u0698\u06cc]/.test(sample) && !/[\u0629\u0649]/.test(sample)) return 'fa'
    if (/[\u06d2\u06c1\u06ba]/.test(sample)) return 'ur'
    if (/[\u06d5\u06c7\u06ad\u06cb]/.test(sample)) return 'ug'
    return 'ar'
  }
  if (has(/[\u0b80-\u0bff]/)) return 'ta'
  if (has(/[\u0c00-\u0c7f]/)) return 'te'
  if (has(/[\u0a80-\u0aff]/)) return 'gu'
  if (has(/[\u0900-\u097f]/)) return 'hi'
  if (has(/[\u0980-\u09ff]/)) return 'bn'
  if (has(/[\u0400-\u04ff]/)) {
    if (/[\u0456\u0457\u0454\u0491]/.test(sample)) return 'uk'
    if (/[\u04d9\u0493\u049b\u04a3\u04e9\u04b1\u04af\u04bb]/.test(sample)) return 'kk'
    if (/[\u04e9\u04af]/.test(sample)) return 'mn'
    return 'ru'
  }
  if (has(/[\u4e00-\u9fff]/)) {
    if (/[嘅咗唔係佢哋冇睇嚟講喺咁噉]/.test(sample)) return 'yue'
    if (/[們為說這個時國學會來對開關間麼樣現發經過還進種應該實際題覺聽寫讀語譯詞術體讓從無數據網頁檔軟硬資訊錯誤鍵盤螢幕視窗裝載啟動執行選單設置歷史記錄輸出匯入轉換複製貼上傳連線離雲端服務器]/.test(sample)) return 'zh-Hant'
    return 'zh'
  }
  if (/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(sample)) return 'vi'
  if (/[ğışİ]/.test(sample)) return 'tr'
  if (/[ąćęłńśźż]/i.test(sample)) return 'pl'
  if (/[ěřů]/.test(sample)) return 'cs'
  if (/ß/.test(sample) || /[äöü]/i.test(sample)) return 'de'
  if (/[ãõ]/.test(sample)) return 'pt'
  if (/[ñ¿¡]/.test(sample)) return 'es'
  if (/œ/.test(sample)) return 'fr'
  const lower = ' ' + sample.toLowerCase().replace(/\s+/g, ' ') + ' '
  const score = {
    en: [' the ', ' and ', ' of ', ' to ', ' is ', ' in ', ' that ', ' it ', ' for ', ' with ', ' on ', ' as ', ' by ', ' are ', ' was ', ' be ', ' this ', ' from ', ' at ', ' a ', ' an ', ' or ', ' which ', ' we ', ' you ', ' they ', ' has ', ' have ', ' not '],
    es: [' el ', ' la ', ' los ', ' las ', ' de ', ' que ', ' y ', ' en ', ' un ', ' una ', ' por ', ' para ', ' es ', ' con ', ' no ', ' del ', ' se ', ' son ', ' este ', ' esta ', ' más ', ' también '],
    fr: [' le ', ' la ', ' les ', ' des ', ' de ', ' est ', ' et ', ' un ', ' une ', ' pour ', ' dans ', ' que ', ' qui ', ' au ', ' du ', ' ne ', ' pas ', ' sur ', ' cette ', ' ce ', ' avec ', ' plus ', ' sont '],
    de: [' der ', ' die ', ' das ', ' und ', ' ist ', ' nicht ', ' ein ', ' eine ', ' mit ', ' für ', ' auf ', ' von ', ' zu ', ' den ', ' dem ', ' sich '],
    it: [' il ', ' lo ', ' la ', ' gli ', ' di ', ' che ', ' e ', ' un ', ' una ', ' per ', ' con ', ' non ', ' del ', ' della ', ' sono ', ' è ', ' su ', ' dei ', ' nel ', ' alla ', ' come ', ' anche ', ' più ', ' questo ', ' questa '],
    pt: [' o ', ' a ', ' os ', ' as ', ' de ', ' que ', ' e ', ' um ', ' uma ', ' para ', ' com ', ' não ', ' do ', ' da ', ' em ', ' é '],
    nl: [' de ', ' het ', ' een ', ' van ', ' en ', ' is ', ' niet ', ' dat ', ' voor ', ' met ', ' op ', ' te ', ' zijn '],
    pl: [' i ', ' w ', ' na ', ' się ', ' nie ', ' jest ', ' to ', ' że ', ' do ', ' z ', ' dla ', ' oraz '],
    cs: [' a ', ' v ', ' se ', ' na ', ' je ', ' že ', ' to ', ' do ', ' pro ', ' s ', ' není ', ' jako '],
    tr: [' ve ', ' bir ', ' bu ', ' için ', ' ile ', ' de ', ' da ', ' olarak ', ' çok ', ' daha ', ' gibi '],
    vi: [' và ', ' của ', ' là ', ' có ', ' trong ', ' một ', ' không ', ' cho ', ' này ', ' được ', ' các '],
    id: [' dan ', ' yang ', ' di ', ' ini ', ' itu ', ' dengan ', ' untuk ', ' tidak ', ' dari ', ' akan ', ' adalah '],
    ms: [' dan ', ' yang ', ' di ', ' ini ', ' itu ', ' dengan ', ' untuk ', ' tidak ', ' dari ', ' akan ', ' ialah '],
    tl: [' ang ', ' ng ', ' sa ', ' na ', ' ay ', ' mga ', ' para ', ' hindi ', ' ito ', ' si ', ' at '],
  }
  let best = 'en'
  let bestScore = 0
  for (const [code, words] of Object.entries(score)) {
    let count = 0
    for (const word of words) {
      if (lower.includes(word)) count += 1
    }
    if (count > bestScore) {
      bestScore = count
      best = code
    }
  }
  // A single function word is too weak a signal ("a" alone is not Portuguese).
  return bestScore >= 2 ? best : 'en'
}

/** The default target for a detected source language, per the agreed behavior. */
export function defaultTargetFor(sourceCode) {
  if (sourceCode === 'zh' || sourceCode === 'zh-Hant' || sourceCode === 'yue') return 'en'
  return 'zh'
}

export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function looksLikeCjk(text) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(String(text))
}

/**
 * Terms that actually occur in one segment. CJK terms use substring matching;
 * Latin terms use word boundaries so `cat` never matches `concatenate`.
 */
export function matchTerms(text, entries, limit = 24) {
  const source = String(text ?? '')
  if (source === '' || !Array.isArray(entries) || entries.length === 0) return []
  const matched = []
  for (const entry of entries) {
    if (!isObject(entry) || entry.status !== 'active') continue
    const term = asString(entry.source).trim()
    const target = asString(entry.target).trim()
    if (term === '' || target === '' || term === target) continue
    let hit
    if (looksLikeCjk(term)) {
      hit = source.includes(term)
    } else {
      hit = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(term)}([^\\p{L}\\p{N}_]|$)`, 'iu').test(source)
    }
    if (!hit) continue
    matched.push({ source: term, target, id: entry.id })
    if (matched.length >= limit) break
  }
  return matched
}

/**
 * Hy-MT2 terminology prompt (official template). `glossary` entries are pairs
 * with `source` and `target`; only matched terms should be passed here.
 */
export function buildTranslationPrompt({ text, targetName, glossary }) {
  const lines = []
  if (Array.isArray(glossary) && glossary.length > 0) {
    lines.push('参考下面的翻译：')
    for (const pair of glossary) {
      lines.push(`${pair.source} 翻译成 ${pair.target}`)
    }
  }
  lines.push(`将以下文本翻译为${targetName}，注意只需要输出翻译后的结果，不要额外解释：`)
  lines.push('')
  lines.push(String(text))
  return lines.join('\n')
}

/**
 * Term listing works far better on a 1.8B translation model than asking for
 * source/target pairs: the model only has to name terms, and each term is then
 * translated with its normal translation instruction.
 */
export function buildTermListPrompt(text, sourceCode) {
  const sample = String(text ?? '').slice(0, 3000)
  if (String(sourceCode).startsWith('zh')) {
    return '下面这段文本里有哪些专有名词或专业术语？只列出词语本身，每行一个，最多 8 个，不要编号，不要解释。\n\n' + sample
  }
  return 'List the proper nouns and technical terms in the text below. One term per line, at most 8, no numbering, no explanation.\n\n' + sample
}

/**
 * Translate several collected terms in one request.
 *
 * The caller only trusts the answer when it comes back with the same number of
 * lines, because a 1.8B model sometimes merges or drops lines; anything else
 * falls back to one request per term.
 */
export function buildTermBatchPrompt(terms, targetName) {
  const list = (Array.isArray(terms) ? terms : []).map(term => String(term ?? '').trim()).filter(Boolean)
  return [
    '将下面每一行分别翻译为' + String(targetName ?? '中文') + '。',
    '保持行数不变，一行只输出一个译文，不要编号，不要额外解释：',
    '',
    list.join('\n'),
  ].join('\n')
}

const CJK_STOPWORDS = new Set([
  '我们', '你们', '他们', '她们', '它们', '这个', '那个', '这些', '那些', '一个', '一些', '没有', '就是', '不是',
  '还是', '因为', '所以', '但是', '如果', '现在', '已经', '需要', '可以', '进行', '支持', '使用', '通过', '以及',
  '其中', '什么', '怎么', '为了', '之后', '之前', '同时', '并且', '或者', '而且', '然后', '因此', '由于', '关于',
  '对于', '根据', '按照', '的话', '这样', '那样', '很多', '非常', '比较', '可能', '应该', '必须', '能够', '得到',
  '完成', '实现', '提供', '包括', '所有', '每个', '不同', '相同', '主要', '重要', '相关', '问题', '情况', '时候',
  '地方', '东西', '事情', '文本', '内容', '部分', '方式', '方法', '过程', '结果', '方面', '这里', '那里', '今天',
  '明天', '昨天', '时间', '工作', '系统', '模型', '术语', '专业', '名词', '词语', '列表', '翻译', '语言',
])

const LATIN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'these', 'those', 'from', 'into', 'your', 'you', 'our', 'their',
  'text', 'term', 'terms', 'word', 'words', 'list', 'proper', 'noun', 'nouns', 'technical', 'translation', 'language',
  'languages', 'model', 'models', 'support', 'supports', 'supports', 'note', 'notes', 'example', 'examples',
])

/** Reject list items that are sentences, instructions or generic words. */
export function isPlausibleTerm(term, sourceText) {
  const text = String(term ?? '').trim().replace(/^[-*\d.、)）\s"“”「」『』]+/, '').replace(/["“”「」『』]+$/, '')
  if (text === '' || text.length > 48) return false
  if (/[。！？!?；;，,].*[。！？!?；;，,]/.test(text)) return false
  if (/[：:]/.test(text)) return false
  const latinWords = text.split(/\s+/).filter(Boolean).length
  if (!looksLikeCjk(text) && latinWords > 5) return false
  if (looksLikeCjk(text) && text.length > 20) return false
  if (CJK_STOPWORDS.has(text)) return false
  if (LATIN_STOPWORDS.has(text.toLowerCase())) return false
  const source = String(sourceText ?? '')
  if (source === '') return true
  if (looksLikeCjk(text)) return source.includes(text)
  return source.toLowerCase().includes(text.toLowerCase())
}

/** Parse a term listing response into unique terms. */
export function parseTermList(raw) {
  const text = String(raw ?? '')
    .replace(/<｜hy_[^｜]*｜>/g, '')
    .replace(/^\s*(?:[-*]|\d+[.)、])\s*/gm, '')
  const pieces = text.split(/\r?\n|[,，、;；]/)
  const seen = new Set()
  const terms = []
  for (const piece of pieces) {
    const cleaned = piece.trim()
    if (cleaned === '') continue
    // Chinese answers often arrive as space-separated words on one line;
    // English answers must keep multi-word names together.
    const tokens = looksLikeCjk(cleaned) ? cleaned.split(/\s+/) : [cleaned]
    for (const token of tokens) {
      const term = token
        .replace(/^["'“”「『《]+|["'“”」』》]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (term === '') continue
      const key = term.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      terms.push(term)
      if (terms.length >= 12) break
    }
    if (terms.length >= 12) break
  }
  return terms
}


/**
 * Clean one model response into a usable translation. Local models sometimes
 * wrap output in quotes, prepend a label, or echo the instruction; strip the
 * mechanical parts without rewriting the content.
 */
export function cleanTranslation(raw, sourceText) {
  let text = String(raw ?? '').trim()
  text = text.replace(/<｜hy_[^｜]*｜>/g, '')
  text = text.replace(/^(?:译文|翻译结果|Translation)\s*[:：]\s*/i, '')
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
    text = text.slice(1, -1).trim()
  }
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  const source = String(sourceText ?? '').trim()
  if (source !== '' && text.startsWith(source) && text.length > source.length) {
    text = text.slice(source.length).replace(/^[\s:：-]+/, '').trim()
  }
  return text
}

/** Split a CSV line honoring double quotes. */
export function parseCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

/** Parse glossary imports: CSV (`source,target[,note]`) or JSON array/object. */
export function parseGlossaryImport(text, format) {
  const raw = String(text ?? '').trim()
  if (raw === '') return []
  if (format === 'json' || raw.startsWith('[') || raw.startsWith('{')) {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('JSON 解析失败：请确认导入文件是合法的 JSON')
    }
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.entries) ? parsed.entries : []
    return list
      .map(entry => ({
        source: asString(entry?.source ?? entry?.src).trim(),
        target: asString(entry?.target ?? entry?.dst).trim(),
        sourceLang: asString(entry?.sourceLang ?? entry?.source_lang).trim() || undefined,
        targetLang: asString(entry?.targetLang ?? entry?.target_lang).trim() || undefined,
        scope: entry?.scope === 'global' ? 'global' : entry?.scope === 'pair' ? 'pair' : undefined,
        status: entry?.status === 'pending' ? 'pending' : entry?.status === 'active' ? 'active' : undefined,
        note: asString(entry?.note).trim(),
      }))
      .filter(entry => entry.source !== '' && entry.target !== '')
      .slice(0, 5000)
  }
  const rows = []
  const lines = raw.split(/\r?\n/)
  const header = parseCsvLine(lines[0] ?? '').map(cell => cell.trim().toLowerCase())
  const column = name => header.indexOf(name)
  const hasHeader = column('source') >= 0 || header.includes('原文')
  const index = {
    source: column('source') >= 0 ? column('source') : 0,
    target: column('target') >= 0 ? column('target') : 1,
    note: column('note') >= 0 ? column('note') : 2,
    sourceLang: column('source_lang') >= 0 ? column('source_lang') : -1,
    targetLang: column('target_lang') >= 0 ? column('target_lang') : -1,
    scope: column('scope') >= 0 ? column('scope') : -1,
    status: column('status') >= 0 ? column('status') : -1,
  }
  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    if (line.trim() === '') continue
    const cells = parseCsvLine(line)
    const source = (cells[index.source] ?? '').trim()
    const target = (cells[index.target] ?? '').trim()
    if (source === '' || target === '') continue
    const row = { source, target, note: (cells[index.note] ?? '').trim() }
    if (index.sourceLang >= 0) row.sourceLang = asString(cells[index.sourceLang]).trim() || undefined
    if (index.targetLang >= 0) row.targetLang = asString(cells[index.targetLang]).trim() || undefined
    if (index.scope >= 0) {
      const scope = asString(cells[index.scope]).trim().toLowerCase()
      if (scope === 'global' || scope === 'pair') row.scope = scope
    }
    if (index.status >= 0) {
      const status = asString(cells[index.status]).trim().toLowerCase()
      if (status === 'pending' || status === 'active') row.status = status
    }
    rows.push(row)
    if (rows.length >= 5000) break
  }
  return rows
}

/** Concatenate translated segments for export, preserving paragraph breaks. */
export function joinSegments(segments) {
  return segments.map(segment => String(segment ?? '').trim()).filter(Boolean).join('\n\n')
}
