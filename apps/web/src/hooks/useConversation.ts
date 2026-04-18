'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Conversation, AIProvider } from '@synap/types'

export function useConversations(userId: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json()
    },
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (aiProvider: AIProvider) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProvider }),
      })
      if (!res.ok) throw new Error('Failed to create conversation')
      return res.json() as Promise<Conversation>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSwitchAI(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newAiProvider: AIProvider) => {
      const res = await fetch(`/api/conversations/${conversationId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAiProvider }),
      })
      if (!res.ok) throw new Error('Failed to switch AI')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
