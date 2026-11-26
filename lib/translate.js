/**
 * Translation orchestration on top of the managed llama-server.
 *
 * One request per paragraph keeps alignment exact: segment N of the source
 * always owns segment N of the output. Concurrency is intentionally 1 because
 * the server runs with `-np 1` and a 1.8B model on a small GPU.
 */

import {
  buildTermBatchPrompt,
  buildTermListPrompt,
  buildTranslationPrompt,
  cleanTranslation,
  defaultTargetFor,
  detectLanguage,
  isPlausibleTerm,
  joinSegments,
  languageName,
  matchTerms,
  parseTermList,
} from './shared.js'

const CHAT_TIMEOUT_MS = 600000

function abortError() {
  const error = new Error('请求已取消')
  error.name = 'AbortError'
  return error
}

/** POST one chat completion, optionally streaming deltas through `onDelta`. */
export async function chatCompletion(port, request, options = {}) {
  const { onDelta, signal } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? CHAT_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  if (signal !== undefined) {
    if (signal.aborted) {
      clearTimeout(timer)
      throw abortError()
    }
    signal.addEventListener('abort', abortFromCaller, { once: true })
  }
  try {
    const body = { ...request, stream: typeof onDelta === 'function' }
    const response = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: onDelta ? 'text/event-stream' : 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 800)
      const error = new Error('本地模型返回 HTTP ' + response.status + (detail === '' ? '' : '：' + detail))
      error.code = 'LLM_HTTP_' + response.status
      throw error
    }
    if (typeof onDelta !== 'function') {
      const payload = await response.json()
      return String(payload?.choices?.[0]?.message?.content ?? '')
    }
    if (response.body === null) throw new Error('本地模型没有返回内容')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let complete = ''
    let finished = false
    while (!finished) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const event = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
        const dataLines = event
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())
        if (dataLines.length === 0) continue
        const data = dataLines.join('\n')
        if (data === '[DONE]') {
          finished = true
          break
        }
        let payload
        try {
          payload = JSON.parse(data)
        } catch {
          continue
        }
        const piece = payload?.choices?.[0]?.delta?.content
        if (typeof piece !== 'string' || piece === '') continue
        complete += piece
        onDelta(piece, complete)
      }
    }
    try {
      await reader.cancel()
    } catch {
      /* stream already closed */
    }
    return complete
  } catch (error) {
    if (controller.signal.aborted && !(signal?.aborted === true)) {
      const timeoutError = new Error('本地模型响应超时（' + Math.round((options.timeoutMs ?? CHAT_TIMEOUT_MS) / 1000) + ' 秒）')
      timeoutError.code = 'LLM_TIMEOUT'
      throw timeoutError
    }
    if (signal?.aborted === true) throw abortError()
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

export function resolvePair(sourceLang, targetLang, text) {
  const detected = detectLanguage(text)
  const source = sourceLang === 'auto' || sourceLang === undefined || sourceLang === ''
    ? detected
    : sourceLang
  const target = targetLang === 'auto' || targetLang === undefined || targetLang === ''
    ? defaultTargetFor(source)
    : targetLang
  return { source, target, detected }
}

function chatBody(settings, prompt, maxTokens) {
  return {
    model: 'hy-mt2',
    messages: [{ role: 'user', content: prompt }],
    temperature: settings.temperature,
    top_p: settings.topP,
    top_k: settings.topK,
    repeat_penalty: settings.repeatPenalty,
    max_tokens: Math.min(maxTokens, settings.maxTokens),
    cache_prompt: true,
  }
}

/**
 * Translate every segment in order, emitting progress events.
 *
 * Event shapes consumed by the panel:
 *   meta, segment-start, delta, segment, retry, done
 */
export async function translateSegments(options) {
  const {
    manager,
    settings,
    glossaryStore,
    segments,
    sourceLang,
    targetLang,
    onEvent,
    signal,
  } = options
  const texts = segments.map(segment => String(segment ?? '').trim()).filter(text => text !== '')
  if (texts.length === 0) throw new Error('没有可翻译的文本')
  if (texts.length > 500) throw new Error('一次最多翻译 500 段，请分批处理')
  const joined = texts.join('\n')
  if (joined.length > 120000) throw new Error('一次最多翻译 12 万个字符，请分段处理')
  const pair = resolvePair(sourceLang, targetLang, joined)
  if (pair.source === pair.target) {
    throw new Error('源语言和目标语言相同（都是' + languageName(pair.target) + '），请换一个目标语言')
  }
  const entries = await glossaryStore.termsFor(pair.source, pair.target)
  onEvent({
    type: 'meta',
    sourceLang: pair.source,
    targetLang: pair.target,
    sourceName: languageName(pair.source),
    targetName: languageName(pair.target),
    segmentCount: texts.length,
  })
  const used = new Map()
  const results = []
  await manager.withServer(async port => {
    for (let index = 0; index < texts.length; index += 1) {
      if (signal?.aborted) throw abortError()
      const text = texts[index]
      const terms = matchTerms(text, entries, settings.maxTermsPerSegment)
      for (const term of terms) used.set(term.id, term)
      const prompt = buildTranslationPrompt({
        text,
        targetName: languageName(pair.target),
        glossary: terms,
      })
      onEvent({ type: 'segment-start', index, terms: terms.map(term => term.source) })
      let raw = ''
      try {
        raw = await chatCompletion(port, chatBody(settings, prompt, 4096), {
          signal,
          onDelta: piece => onEvent({ type: 'delta', index, text: piece }),
        })
      } catch (error) {
        if (error?.name === 'AbortError') throw error
        onEvent({ type: 'segment-error', index, error: String(error?.message ?? error) })
        throw error
      }
      const target = cleanTranslation(raw, text)
      if (target === '') {
        throw new Error('本地模型对第 ' + (index + 1) + ' 段返回了空译文，请重试或调低温度')
      }
      results.push({ source: text, target })
      onEvent({ type: 'segment', index, text: target })
    }
  })
  const glossaryUsed = [...used.values()]
  await glossaryStore.markUsed(glossaryUsed.map(term => term.id))
  const record = {
    sourceLang: pair.source,
    targetLang: pair.target,
    segments: results,
    glossaryUsed,
    model: 'Hy-MT2-1.8B',
  }
  onEvent({ type: 'done', ...record, translation: joinSegments(results.map(item => item.target)) })
  return record
}

/**
 * Translate the collected terms, preferring one batched request.
 *
 * The batch answer is only trusted when the model returns exactly one line per
 * term; otherwise each term is translated on its own, the layout a 1.8B model
 * follows most reliably.
 */
async function translateTermList(manager, settings, terms, targetName) {
  const byTerm = new Map()
  if (terms.length > 1) {
    try {
      const raw = await manager.withServer(port => chatCompletion(port, {
        ...chatBody(settings, buildTermBatchPrompt(terms, targetName), Math.max(160, terms.length * 48)),
        temperature: 0.3,
      }, { timeoutMs: 180000 }))
      const lines = String(raw ?? '')
        .replace(/<｜hy_[^｜]*｜>/g, '')
        .replace(/\r/g, '')
        .split('\n')
        .map(line => line.replace(/^\s*(?:[-*]|\d+[.)、])\s*/, '').trim())
        .filter(line => line !== '')
      if (lines.length === terms.length) {
        terms.forEach((term, index) => byTerm.set(term, lines[index]))
      }
    } catch {
      /* fall through to per-term requests */
    }
  }
  for (const term of terms) {
    if (byTerm.has(term)) continue
    let translated = ''
    try {
      translated = await manager.withServer(port => chatCompletion(port, {
        ...chatBody(settings, buildTranslationPrompt({ text: term, targetName, glossary: [] }), 80),
        temperature: 0.3,
      }, { timeoutMs: 120000 }))
    } catch {
      translated = ''
    }
    byTerm.set(term, translated)
  }
  return byTerm
}

/**
 * Build glossary candidates for finished paragraph pairs. A 1.8B translation
 * model is reliable at translating a single term and unreliable at emitting
 * structured source/target tables, so the flow is: ask for a short term list,
 * then translate the terms (batched when the model keeps the line count).
 */
export async function extractGlossary(options) {
  const { manager, settings, glossaryStore, pairs, sourceLang, targetLang } = options
  const cleanPairs = (Array.isArray(pairs) ? pairs : [])
    .map(pair => ({
      source: String(pair?.source ?? '').trim(),
      target: String(pair?.target ?? '').trim(),
    }))
    .filter(pair => pair.source !== '')
    .slice(0, 12)
  if (cleanPairs.length === 0) return { added: 0, skipped: 0, entries: [], reason: 'no-pairs' }
  await glossaryStore.load()
  const existingKeys = new Set(glossaryStore.entries.map(entry => entry.source.toLowerCase()))
  const sourceText = cleanPairs.map(pair => pair.source).join('\n')
  const listPrompt = buildTermListPrompt(sourceText, sourceLang)
  const listRaw = await manager.withServer(port => chatCompletion(port, chatBody(settings, listPrompt, 500), { timeoutMs: 180000 }))
  const listed = parseTermList(listRaw)
    .filter(term => isPlausibleTerm(term, sourceText))
    .filter(term => !existingKeys.has(term.toLowerCase()))
    .slice(0, 10)
  if (listed.length === 0) return { added: 0, skipped: 0, entries: [], reason: 'no-candidates' }

  const translated = await translateTermList(manager, settings, listed, languageName(targetLang))
  const candidates = []
  for (const term of listed) {
    const target = cleanTranslation(translated.get(term) ?? '', term)
    if (target === '' || target.length > 96 || target.toLowerCase() === term.toLowerCase()) continue
    if (/[。！？!?]/.test(target) && term.length <= 12) continue
    candidates.push({ source: term, target })
  }
  if (candidates.length === 0) return { added: 0, skipped: 0, entries: [], reason: 'no-usable-candidates' }
  const result = await glossaryStore.addMany(candidates, {
    status: 'pending',
    scope: 'pair',
    sourceLang,
    targetLang,
  })
  return result
}

/** Non-streaming convenience used by the agent tool. */
export async function translateText(options) {
  const collected = []
  const record = await translateSegments({
    ...options,
    onEvent: event => {
      if (event.type === 'segment') collected.push(event)
    },
  })
  return { record, translation: joinSegments(record.segments.map(item => item.target)) }
}
