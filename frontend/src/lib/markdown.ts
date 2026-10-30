/**
 * Minimal, dependency-free parser for the Markdown subset the assistant is
 * instructed to use. It produces plain data (never HTML); React renders the
 * nodes as text, so model output can never inject markup or scripts.
 */
export type InlineNode = { kind: 'text' | 'code' | 'bold'; text: string }

export type Block =
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

const FENCE = /^\s*```\s*([\w+#.-]*)\s*$/
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/
const BULLET = /^\s*[-*•]\s+(.*)$/
const ORDERED = /^\s*\d+[.)]\s+(.*)$/

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join('\n') })
    paragraph = []
  }
  const flushList = () => {
    if (list) blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
    list = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = FENCE.exec(line)

    if (fence) {
      flushParagraph()
      flushList()
      const code: string[] = []
      i++
      // An unterminated fence consumes the rest of the text as code.
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++])
      blocks.push({ kind: 'code', lang: fence[1], code: code.join('\n') })
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'heading', text: heading[1].trim() })
      continue
    }

    const bullet = BULLET.exec(line)
    const ordered = bullet ? null : ORDERED.exec(line)
    const item = bullet ?? ordered
    if (item) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      if (list && list.ordered !== isOrdered) flushList()
      if (!list) list = { ordered: isOrdered, items: [] }
      list.items.push(item[1].trim())
      continue
    }

    if (list && /^\s+\S/.test(line)) {
      // Indented continuation of the previous list item.
      list.items[list.items.length - 1] += ' ' + line.trim()
      continue
    }

    flushList()
    paragraph.push(line)
  }
  flushParagraph()
  flushList()
  return blocks
}

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/

export function parseInline(text: string): InlineNode[] {
  return text
    .split(INLINE)
    .filter((part) => part.length > 0)
    .map((part): InlineNode => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return { kind: 'code', text: part.slice(1, -1) }
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return { kind: 'bold', text: part.slice(2, -2) }
      }
      return { kind: 'text', text: part }
    })
}
