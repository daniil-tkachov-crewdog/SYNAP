import { create } from 'zustand'
import type { AIProvider } from '@synap/types'

interface ChatStore {
  activeAI: AIProvider
  isSending: boolean
  setActiveAI: (ai: AIProvider) => void
  setSending: (sending: boolean) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  activeAI: 'chatgpt',
  isSending: false,
  setActiveAI: (ai) => set({ activeAI: ai }),
  setSending: (sending) => set({ isSending: sending }),
}))
