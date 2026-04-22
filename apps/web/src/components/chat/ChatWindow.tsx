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
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === payload.new.id)
              if (exists) return prev
              return [...prev, payload.new as DbMessage]
            })
            setSending(false)
            if ((payload.new as DbMessage).is_context_summary) {
              setSwitching(false)
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? (payload.new as DbMessage) : m))
            )
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
      const res = await fetch(`/api/conversations/${conversation.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAiProvider: newAI }),
      })
      if (!res.ok) throw new Error('Failed to summarize')

      const { requestId, summaryPrompt, previousAi } = await res.json()

      // Conversation current_ai already updated in DB — refresh server props
      router.refresh()

      // Send summary prompt to extension; response arrives via webhook → Realtime
      const { data: { session } } = await supabase.auth.getSession()
      if (session && window.chrome?.runtime) {
        const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID!
        window.chrome.runtime.sendMessage(
          extensionId,
          {
            type: 'SEND_MESSAGE',
            payload: {
              requestId,
              conversationId: conversation.id,
              aiProvider: previousAi,
              fullMessage: summaryPrompt,
              authToken: session.access_token,
              webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/extension`,
              isSummary: true,
            },
          },
          () => {
            // Fire-and-forget; switching state cleared by Realtime when summary arrives
            if (window.chrome.runtime.lastError) {
              setSwitching(false)
            }
          }
        )
      } else {
        setSwitching(false)
      }
    } catch {
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
