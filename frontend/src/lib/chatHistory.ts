// Limits mirror backend/app/schemas/ai.py. The server enforces them too —
// these only keep well-behaved requests from being rejected.
export const CHAT_MESSAGE_MAX_CHARS = 2000
export const CHAT_HISTORY_TURN_MAX_CHARS = 4000
export const CHAT_HISTORY_MAX_TURNS = 20
export const CHAT_HISTORY_MAX_TOTAL_CHARS = 12000

export type ChatRole = 'user' | 'assistant'

export interface ChatTurn {
  role: ChatRole
  content: string
}

export interface TranscriptMessage extends ChatTurn {
  id: number
  /** The request for this (user) message failed; it never received an answer. */
  failed?: boolean
}

/**
 * Build the bounded context sent with a follow-up question.
 *
 * - Failed (unanswered) messages are excluded so the model never sees a turn
 *   it did not answer.
 * - Each turn is truncated, then the OLDEST turns are dropped until both the
 *   turn-count and total-size limits are met.
 * - The message being sent now is not included; the server appends it.
 */
export function buildHistory(messages: TranscriptMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = messages
    .filter((m) => !m.failed && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, CHAT_HISTORY_TURN_MAX_CHARS) }))

  let recent = turns.slice(-CHAT_HISTORY_MAX_TURNS)
  let total = recent.reduce((sum, t) => sum + t.content.length, 0)
  while (recent.length > 0 && total > CHAT_HISTORY_MAX_TOTAL_CHARS) {
    total -= recent[0].content.length
    recent = recent.slice(1)
  }
  return recent
}
