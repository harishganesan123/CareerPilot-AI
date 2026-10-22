import { parseBlocks, parseInline } from '../../lib/markdown'

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((node, i) => {
        if (node.kind === 'code') {
          return (
            <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800">
              {node.text}
            </code>
          )
        }
        if (node.kind === 'bold') return <strong key={i}>{node.text}</strong>
        return <span key={i}>{node.text}</span>
      })}
    </>
  )
}

/**
 * Renders assistant output. Everything is emitted as React text nodes —
 * there is no dangerouslySetInnerHTML, so model output cannot inject markup.
 */
export default function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed break-words">
      {parseBlocks(content).map((block, i) => {
        switch (block.kind) {
          case 'code':
            return (
              <pre
                key={i}
                tabIndex={0}
                aria-label={block.lang ? `${block.lang} code example` : 'Code example'}
                className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100"
              >
                <code>{block.code}</code>
              </pre>
            )
          case 'heading':
            return (
              <p key={i} className="font-semibold text-slate-900">
                <Inline text={block.text} />
              </p>
            )
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
              <Tag
                key={i}
                className={`space-y-1 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </Tag>
            )
          }
          default:
            return (
              <p key={i} className="whitespace-pre-line">
                <Inline text={block.text} />
              </p>
            )
        }
      })}
    </div>
  )
}
