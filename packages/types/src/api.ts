import type { AIProvider } from './ai.js'
import type { MemoryCategory } from './memory.js'

// ─── Conversations ────────────────────────────────────────────────────────────

export interface CreateConversationRequest {
  aiProvider: AIProvider
  title?: string
}

export interface SendMessageRequest {
  content: string
  aiProvider: AIProvider
}

export interface SendMessageResponse {
  requestId: string
  userMessageId: string
  memoryInjected: boolean
}

export interface SummarizeResponse {
  summaryMessageId: string
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export interface CreateMemoryFactRequest {
  category: MemoryCategory
  key: string
  value: string
}

export interface UpdateMemoryFactRequest {
  key?: string
  value?: string
  isActive?: boolean
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
}
