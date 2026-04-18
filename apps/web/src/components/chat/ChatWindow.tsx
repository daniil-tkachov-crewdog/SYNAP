'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { ContextSwitchBanner } from './ContextSwitchBanner'
import type { Conversation, Message, AIProvider } from '@synap/types'
import type { Database } from '@synap/db'

type DbConversation = Database['public']['Tables']['conversations']['Row']
type DbMessage = Database['public']['Tables']['messages']['Row']

interface Props {
  conversation: DbConversation
  initialMessages: DbMessage[]
  userId: string
}

export function ChatWindow({ conversation, initialMessages, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const { setActiveAI, setSending, isSending } = useChatStore()

  const [messages, setMessages] = useState<DbMessage[]>(initialMessages)
  const [switching, setSwitching] = useState(false)

  // Keep active AI in sync with conversation
  useEffect(() => {
    setActiveAI(conversation.current_ai as AIProvider)
  }, [conversation.current_ai, setActiveAI])

  // Subscribe to Supabase Realtime for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as DbMessage
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === newMsg.id)
              if (exists) return prev
              return [...prev, newMsg]
            })
            if (newMsg.role === 'assistant') setSending(false)
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as DbMessage
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            )
            if (updatedMsg.role === 'assistant') setSending(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase, setSending])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(content: string, aiProvider: AIProvider) {
    setSending(true)

    // Optimistic user message
    const optimisticMsg: DbMessage = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      user_id: userId,
      role: 'user',
      content,
      ai_provider: null,
      is_context_summary: false,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, aiProvider }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()

      // Remove optimistic message (Realtime will add the real one)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))

      // Send to extension
      const { session } = (await supabase.auth.getSession()).data
      if (session && window.chrome?.runtime) {
        const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID!
        window.chrome.runtime.sendMessage(
          extensionId,
          {
            type: 'SEND_MESSAGE',
            payload: {
              requestId: data.requestId,
              conversationId: conversation.id,
              aiProvider,
              fullMessage: data.fullMessage,
              authToken: session.access_token,
              webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/extension`,
            },
          },
          (response) => {
            if (window.chrome.runtime.lastError || !response?.requestId) {
              setSending(false)
            }
          }
        )
      } else {
        setSending(false)
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setSending(false)
    }
  }

  async function handleSwitchAI(newAI: AIProvider) {
    setSwitching(true)
    try {
      await fetch(`/api/conversations/${conversation.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAiProvider: newAI }),
      })
      router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {switching && <ContextSwitchBanner />}
      <MessageList messages={messages} />
      <div ref={bottomRef} />
      <InputBar
        conversationId={conversation.id}
        currentAI={conversation.current_ai as AIProvider}
        isSending={isSending}
        onSend={handleSend}
        onSwitchAI={handleSwitchAI}
      />
    </div>
  )
}
