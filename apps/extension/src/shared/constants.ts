import type { AIProvider, AISelectors } from '@synap/types'

export const AI_URLS: Record<AIProvider, string> = {
  chatgpt: 'https://chatgpt.com',
  claude: 'https://claude.ai',
  grok: 'https://grok.com',
  deepseek: 'https://chat.deepseek.com',
}

export const AI_SELECTORS: Record<string, AISelectors> = {
  chatgpt: {
    inputSelector: '#prompt-textarea',
    submitButtonSelector: '[data-testid="send-button"]',
    responseContainerSelector: '[data-message-author-role="assistant"]',
    streamingIndicatorSelector: '[data-testid="stop-button"]',
    newChatUrl: 'https://chatgpt.com/',
  },
  claude: {
    inputSelector: '.ProseMirror[contenteditable="true"]',
    submitButtonSelector: 'button[aria-label="Send message"]',
    responseContainerSelector: '[data-is-streaming]',
    streamingIndicatorSelector: '[data-is-streaming="true"]',
    newChatUrl: 'https://claude.ai/new',
  },
}

export const EXTENSION_VERSION = '0.1.0'

// How long to wait for a tab to load before timing out (ms)
export const TAB_LOAD_TIMEOUT = 30_000

// How long to wait for an AI response before timing out (ms)
export const RESPONSE_TIMEOUT = 120_000

// Keepalive ping interval to prevent SW termination (ms)
export const KEEPALIVE_INTERVAL = 25_000
