import type { AIProvider } from './ai.js'

// ─── Selectors ───────────────────────────────────────────────────────────────

export interface AISelectors {
  inputSelector: string
  submitButtonSelector: string
  responseContainerSelector: string
  streamingIndicatorSelector: string
  newChatUrl: string
}

// ─── Web App → Extension (via chrome.runtime.sendMessage externally) ─────────

export type WebToExtensionMessage =
  | { type: 'PING' }
  | { type: 'GET_STATUS' }
  | {
      type: 'SEND_MESSAGE'
      payload: {
        requestId: string
        conversationId: string
        aiProvider: AIProvider
        fullMessage: string
        authToken: string
        webhookUrl: string
      }
    }
  | { type: 'OPEN_AI_TAB'; payload: { aiProvider: AIProvider } }
  | { type: 'CAPTURE_CONVERSATION'; payload: { aiProvider: AIProvider } }

// ─── Extension → Web App (sync response to sendMessage) ──────────────────────

export type ExtensionToWebResponse =
  | { type: 'PONG'; ok: true; version: string }
  | { type: 'STATUS'; tabs: TabRecord[]; pendingRequests: number }
  | { type: 'MESSAGE_QUEUED'; requestId: string }
  | { type: 'ERROR'; message: string }

// ─── Background SW ↔ Content Script ──────────────────────────────────────────

export type BGToContentMessage =
  | {
      type: 'EXECUTE_MESSAGE'
      payload: {
        requestId: string
        fullMessage: string
        selectors: AISelectors
      }
    }
  | { type: 'NAVIGATE_NEW_CHAT'; payload: { url: string } }
  | { type: 'EXTRACT_CONVERSATION' }

export type ContentToBGMessage =
  | { type: 'READY'; aiProvider: string }
  | { type: 'RESPONSE_CHUNK'; requestId: string; chunk: string }
  | { type: 'RESPONSE_COMPLETE'; requestId: string; fullText: string }
  | { type: 'RESPONSE_ERROR'; requestId: string; error: string }
  | { type: 'CONVERSATION_EXTRACTED'; messages: Array<{ role: string; content: string }> }
  | { type: 'KEEPALIVE' }

// ─── Internal Extension State ─────────────────────────────────────────────────

export type RequestStatus = 'queued' | 'typing' | 'waiting' | 'complete' | 'error'

export interface PendingRequest {
  requestId: string
  conversationId: string
  aiProvider: AIProvider
  fullMessage: string
  authToken: string
  webhookUrl: string
  tabId?: number
  status: RequestStatus
  createdAt: number
}

export interface TabRecord {
  tabId: number
  aiProvider: AIProvider
  status: 'idle' | 'busy'
}

// ─── Extension → Synap API (webhook payload) ─────────────────────────────────

export interface ExtensionWebhookPayload {
  requestId: string
  conversationId: string
  aiProvider: AIProvider
  content: string
  isPartial?: boolean
  isError?: boolean
  errorMessage?: string
}
