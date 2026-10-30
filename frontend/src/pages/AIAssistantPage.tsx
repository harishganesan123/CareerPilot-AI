import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AlertCircle, ArrowUpRight, BrainCircuit, Loader2, RotateCcw, SendHorizontal, Sparkles, Trash2, UserRound } from 'lucide-react'
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
      <div className="mx-auto flex h-[calc(100dvh-8rem)] min-h-[34rem] max-w-6xl flex-col gap-5">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D3F5A] via-[#285773] to-[#437B98] p-5 text-white shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
                <Sparkles size={14} aria-hidden="true" /> Your AI study companion
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Learn, practise, and build confidence.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
                Ask questions about AI, programming, data science, and career preparation. Get explanations, examples, quizzes, and study plans.
              </p>
            </div>
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
              <BrainCircuit size={38} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E2ECF1] bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-[#E2ECF1] bg-[#F8FBFC] px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-[#1D3F5A]">Conversation</p>
            <p className="mt-0.5 text-xs text-[#718597]">
              {messages.length === 0 ? 'Choose a prompt to get started, or ask your own question.' : `${messages.length} message${messages.length === 1 ? '' : 's'} in this conversation`}
            </p>
          </div>
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
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.length === 0 && !loading && (
            <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F7FA] text-[#1D3F5A]">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">What would you like to learn today?</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">Start with one of these prompts, or type a question below. You can ask follow-up questions in the same conversation.</p>
              <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="group flex min-h-[4.25rem] items-start justify-between gap-3 rounded-xl border border-[#E2ECF1] bg-white px-3.5 py-3 text-left text-sm leading-5 text-[#29465D] transition hover:border-[#96CAD3] hover:bg-[#F0F7FA]"
                  >
                    <span>{prompt}</span>
                    <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-[#718597] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  m.role === 'user'
                    ? 'bg-[#1D3F5A] text-white'
                    : 'bg-[#F0F7FA] text-[#1D3F5A]'
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
                      ? 'bg-[#1D3F5A] text-white'
                      : 'border border-[#E2ECF1] bg-[#F8FBFC] text-slate-800'
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FA] text-[#1D3F5A]">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              </span>
              <div className="rounded-2xl border border-[#E2ECF1] bg-[#F8FBFC] px-4 py-2.5 text-sm text-slate-500">
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

        <div className="border-t border-[#E2ECF1] bg-white p-3 sm:p-4">
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
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#437B98] focus:ring-2 focus:ring-[#96CAD3]/40"
              />
            </div>
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend}
              aria-label="Send message"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#1D3F5A] px-4 text-sm font-semibold text-white transition hover:bg-[#285773] disabled:cursor-not-allowed disabled:opacity-50"
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
        </section>
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
