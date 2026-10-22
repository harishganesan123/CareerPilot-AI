import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AlertCircle, BrainCircuit, Loader2, RotateCcw, SendHorizontal, Sparkles, Trash2, UserRound } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import ConfirmDialog from '../components/ConfirmDialog'
import MessageContent from '../components/ai/MessageContent'
import { chatErrorMessage, sendChatMessage } from '../api/aiAssistant'
import { CHAT_MESSAGE_MAX_CHARS, buildHistory } from '../lib/chatHistory'
import type { ChatTurn, TranscriptMessage } from '../lib/chatHistory'

const STARTER_PROMPTS = [
  'Explain neural networks with a simple example.',
  'Teach me Python decorators.',
  'Explain supervised vs. unsupervised learning.',
  'Create a seven-day machine learning study plan.',
  'Quiz me on operating systems.',
  'Explain transformers at a beginner level.',
]

let nextMessageId = 1

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Synchronous guard: state updates are async, so a fast double Enter could
  // otherwise submit twice before `loading` flips.
  const inFlight = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, loading, error])

  async function request(userMessage: TranscriptMessage, history: ChatTurn[]) {
    inFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const response = await sendChatMessage(userMessage.content, history)
      if (typeof response?.answer !== 'string' || response.answer.trim() === '') {
        throw new Error('malformed')
      }
      setMessages((prev) => [
        ...prev.map((m) => (m.id === userMessage.id ? { ...m, failed: false } : m)),
        { id: nextMessageId++, role: 'assistant', content: response.answer },
      ])
    } catch (err) {
      // Never fabricate an answer: mark the question as unanswered instead.
      setMessages((prev) => prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m)))
      setError(
        err instanceof Error && err.message === 'malformed'
          ? 'The assistant returned an empty answer. Please try again.'
          : chatErrorMessage(err),
      )
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  function send(text: string) {
    const content = text.trim()
    if (!content || content.length > CHAT_MESSAGE_MAX_CHARS || inFlight.current) return
    const history = buildHistory(messages)
    const userMessage: TranscriptMessage = { id: nextMessageId++, role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    void request(userMessage, history)
  }

  function retry() {
    if (inFlight.current) return
    const index = messages.map((m) => m.failed).lastIndexOf(true)
    if (index === -1) return
    void request(messages[index], buildHistory(messages.slice(0, index)))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline. Ignore Enter during IME composition.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  function clearConversation() {
    setMessages([])
    setError(null)
    setConfirmClear(false)
    inputRef.current?.focus()
  }

  const trimmedLength = input.trim().length
  const canSend = trimmedLength > 0 && input.length <= CHAT_MESSAGE_MAX_CHARS && !loading
  const hasFailed = messages.some((m) => m.failed)

  return (
    <DashboardLayout title="AI Learning Assistant">
      <div className="flex h-[calc(100dvh-7.5rem)] min-h-[30rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-600">
            Ask about programming, AI, machine learning, data science or career preparation. Request
            explanations at any level, examples, practice exercises and study plans.
          </p>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={messages.length === 0 || loading}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden="true" />
            Clear
          </button>
        </div>

        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation with the AI Learning Assistant"
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && !loading && (
            <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-base font-semibold text-slate-900">What would you like to learn today?</h2>
              <p className="mt-1 text-sm text-slate-500">Pick a starter or type your own question.</p>
              <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === 'user'
                    ? 'bg-[var(--color-brand-500)] text-white'
                    : 'bg-slate-100 text-[var(--color-brand-600)]'
                }`}
              >
                {m.role === 'user' ? <UserRound size={16} /> : <BrainCircuit size={16} />}
              </span>
              <div className={`min-w-0 max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                <p className="mb-1 text-[11px] font-medium text-slate-400">
                  {m.role === 'user' ? 'You' : 'AI assistant · AI-generated'}
                </p>
                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 text-left ${
                    m.role === 'user'
                      ? 'bg-[var(--color-brand-500)] text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  } ${m.failed ? 'opacity-70 ring-1 ring-red-300' : ''}`}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>
                  ) : (
                    <MessageContent content={m.content} />
                  )}
                </div>
                {m.failed && <p className="mt-1 text-xs text-red-600">Not answered</p>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3" role="status">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[var(--color-brand-600)]">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              </span>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                Thinking…
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{error}</span>
              {hasFailed && (
                <button
                  type="button"
                  onClick={retry}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Retry
                </button>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="assistant-input" className="sr-only">
                Your question
              </label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={CHAT_MESSAGE_MAX_CHARS}
                placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)]"
              />
            </div>
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend}
              aria-label="Send message"
              className="flex h-10 items-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <SendHorizontal size={16} aria-hidden="true" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>
              AI-generated answers may be inaccurate — verify important information. Answers use general AI
              knowledge, not your uploaded materials.
            </p>
            {input.length > CHAT_MESSAGE_MAX_CHARS * 0.75 && (
              <span className="shrink-0">
                {input.length}/{CHAT_MESSAGE_MAX_CHARS}
              </span>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear conversation"
        message="Remove all messages from this conversation? The assistant will no longer have this context."
        confirmLabel="Clear"
        onConfirm={clearConversation}
        onCancel={() => setConfirmClear(false)}
      />
    </DashboardLayout>
  )
}
