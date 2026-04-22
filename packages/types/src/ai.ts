export type AIProvider = 'chatgpt' | 'claude' | 'grok' | 'deepseek'

export const AI_PROVIDERS: Record<AIProvider, { name: string; url: string; color: string; status: 'available' | 'coming_soon' }> = {
  chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f', status: 'available' },
  claude: { name: 'Claude', url: 'https://claude.ai', color: '#d97706', status: 'available' },
  grok: { name: 'Grok', url: 'https://grok.com', color: '#1d9bf0', status: 'coming_soon' },
  deepseek: { name: 'DeepSeek', url: 'https://chat.deepseek.com', color: '#4f46e5', status: 'coming_soon' },
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  conversationId: string
  userId: string
  role: MessageRole
  content: string
  aiProvider: AIProvider | null
  isContextSummary: boolean
  metadata: Record<string, unknown>
  createdAt: string
}

export interface Conversation {
  id: string
  userId: string
  title: string | null
  currentAi: AIProvider
  memoryInjected: boolean
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
}
