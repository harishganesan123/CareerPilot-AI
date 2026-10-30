import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAT_HISTORY_MAX_TOTAL_CHARS,
  CHAT_HISTORY_MAX_TURNS,
  CHAT_HISTORY_TURN_MAX_CHARS,
  buildHistory,
} from '../src/lib/chatHistory.ts'
import type { TranscriptMessage } from '../src/lib/chatHistory.ts'

const msg = (id: number, role: 'user' | 'assistant', content: string, failed = false): TranscriptMessage => ({
  id, role, content, ...(failed ? { failed } : {}),
})

test('keeps messages in order and does not add the current message', () => {
  const h = buildHistory([msg(1, 'user', 'q1'), msg(2, 'assistant', 'a1')])
  assert.deepEqual(h, [{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1' }])
})

test('empty transcript gives empty history', () => {
  assert.deepEqual(buildHistory([]), [])
})

test('excludes failed (unanswered) messages so the model never sees them', () => {
  const h = buildHistory([msg(1, 'user', 'q1'), msg(2, 'assistant', 'a1'), msg(3, 'user', 'bad', true)])
  assert.deepEqual(h.map((t) => t.content), ['q1', 'a1'])
})

test('caps the number of turns, keeping the most recent', () => {
  const all = Array.from({ length: 30 }, (_, i) => msg(i, i % 2 ? 'assistant' : 'user', `m${i}`))
  const h = buildHistory(all)
  assert.equal(h.length, CHAT_HISTORY_MAX_TURNS)
  assert.equal(h.at(-1)?.content, 'm29')
  assert.equal(h[0].content, 'm10')
})

test('truncates a single oversized turn', () => {
  const h = buildHistory([msg(1, 'assistant', 'x'.repeat(CHAT_HISTORY_TURN_MAX_CHARS + 500))])
  assert.equal(h[0].content.length, CHAT_HISTORY_TURN_MAX_CHARS)
})

test('drops oldest turns until total size fits the limit', () => {
  const big = 'y'.repeat(CHAT_HISTORY_TURN_MAX_CHARS - 10) // under the per-turn cap, so only total-size trimming applies
  const all = Array.from({ length: 6 }, (_, i) => msg(i, i % 2 ? 'assistant' : 'user', big + i))
  const h = buildHistory(all)
  const total = h.reduce((s, t) => s + t.content.length, 0)
  assert.ok(total <= CHAT_HISTORY_MAX_TOTAL_CHARS)
  assert.ok(h.length < 6, 'some old turns were dropped')
  assert.ok(h.at(-1)!.content.endsWith('5'), 'newest turn is kept')
})

test('skips blank messages (server rejects empty history content)', () => {
  assert.deepEqual(buildHistory([msg(1, 'user', '   '), msg(2, 'user', 'ok')]).map((t) => t.content), ['ok'])
})
