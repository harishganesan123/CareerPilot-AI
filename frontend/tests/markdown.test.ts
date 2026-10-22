import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBlocks, parseInline } from '../src/lib/markdown.ts'

test('paragraphs split on blank lines', () => {
  const b = parseBlocks('First para.\n\nSecond para.')
  assert.deepEqual(b.map((x) => x.kind), ['paragraph', 'paragraph'])
})

test('fenced code keeps content verbatim, including HTML, as data', () => {
  const b = parseBlocks('Look:\n```python\nprint("<script>alert(1)</script>")\n```\nDone')
  const code = b.find((x) => x.kind === 'code')
  assert.ok(code && code.kind === 'code')
  assert.equal(code.lang, 'python')
  assert.equal(code.code, 'print("<script>alert(1)</script>")')
  assert.deepEqual(b.map((x) => x.kind), ['paragraph', 'code', 'paragraph'])
})

test('unterminated fence consumes the rest as code instead of breaking', () => {
  const b = parseBlocks('```js\nlet a = 1')
  assert.deepEqual(b, [{ kind: 'code', lang: 'js', code: 'let a = 1' }])
})

test('bullet and ordered lists', () => {
  const b = parseBlocks('- one\n- two\n\n1. first\n2. second')
  assert.deepEqual(b, [
    { kind: 'list', ordered: false, items: ['one', 'two'] },
    { kind: 'list', ordered: true, items: ['first', 'second'] },
  ])
})

test('switching list type without a blank line starts a new list', () => {
  const b = parseBlocks('- a\n1. b')
  assert.deepEqual(b.map((x) => x.kind === 'list' && x.ordered), [false, true])
})

test('indented continuation joins the previous list item', () => {
  const b = parseBlocks('- item one\n  continues here')
  assert.deepEqual(b, [{ kind: 'list', ordered: false, items: ['item one continues here'] }])
})

test('headings become heading blocks', () => {
  assert.deepEqual(parseBlocks('## Title\ntext'), [
    { kind: 'heading', text: 'Title' },
    { kind: 'paragraph', text: 'text' },
  ])
})

test('CRLF input is handled', () => {
  assert.equal(parseBlocks('a\r\n\r\nb').length, 2)
})

test('inline code and bold are parsed; raw HTML stays plain text', () => {
  const n = parseInline('Use `len()` and **care** with <b>html</b>')
  assert.deepEqual(n.map((x) => x.kind), ['text', 'code', 'text', 'bold', 'text'])
  assert.equal(n.at(-1)?.text, ' with <b>html</b>')
  assert.equal(n.at(-1)?.kind, 'text')
})

test('unbalanced markers are left as text', () => {
  assert.deepEqual(parseInline('a ** b ` c'), [{ kind: 'text', text: 'a ** b ` c' }])
})

test('empty input yields no blocks', () => {
  assert.deepEqual(parseBlocks(''), [])
})
