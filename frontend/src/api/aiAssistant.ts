import axios from 'axios'
import apiClient, { toApiError } from './client'
import type { ChatTurn } from '../lib/chatHistory'

export type { ChatTurn } from '../lib/chatHistory'

export interface ChatRequest {
  message: string
  conversation_history: ChatTurn[]
}

export interface ChatResponse {
  answer: string
  model: string
  /** Phase 2 answers come from general model knowledge, not the student's documents. */
  source: 'general_knowledge'
  latency_ms: number
  note: string
}

/**
 * Ask the AI Learning Assistant. The request goes to our own backend, which
 * holds the provider key; the browser never talks to the AI provider.
 */
export async function sendChatMessage(
  message: string,
  history: ChatTurn[],
): Promise<ChatResponse> {
  const body: ChatRequest = { message, conversation_history: history }
  // The backend allows the model up to ~30s; give the browser a little more.
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', body, { timeout: 45_000 })
  return data
}

/** User-facing message for a failed chat request. */
export function chatErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response && error.code === 'ECONNABORTED') {
    return 'The assistant took too long to respond. Please try again.'
  }
  return toApiError(error).message
}
