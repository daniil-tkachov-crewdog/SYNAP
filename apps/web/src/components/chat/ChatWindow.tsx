'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangleIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { ContextSwitchBanner } from './ContextSwitchBanner'
import type { AIProvider } from '@synap/types'
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
  const [extensionError, setExtensionError] = useState<string | null>(null)

  // Refs avoid stale closures in async callbacks
  const isSwitchingRef = useRef(false)
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

            // Context summary arriving signals that the AI switch is complete
            if (newMsg.is_context_summary && isSwitchingRef.current) {
              clearTimeout(switchTimeoutRef.current ?? undefined)
              isSwitchingRef.current = false
              setSwitching(false)
              router.refresh()
              return
            }

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
      clearTimeout(switchTimeoutRef.current ?? undefined)
    }
  }, [conversation.id, supabase, setSending, router])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(content: string, aiProvider: AIProvider) {
    setExtensionError(null)
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
              setExtensionError('Extension not connected — install it to send messages.')
            }
          }
        )
      } else {
        setSending(false)
        setExtensionError('Extension not connected — install it to send messages.')
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setSending(false)
    }
  }

  async function handleSwitchAI(newAI: AIProvider) {
    isSwitchingRef.current = true
    setSwitching(true)

    try {
      const res = await fetch(`/api/conversations/${conversation.id}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAiProvider: newAI }),
      })

      if (!res.ok) throw new Error('Summarize request failed')

      const data = await res.json()

      // No messages to summarize — AI was already switched server-side
      if (data.skipSummary) {
        isSwitchingRef.current = false
        setSwitching(false)
        router.refresh()
        return
      }

      const { session } = (await supabase.auth.getSession()).data
      if (!session || !window.chrome?.runtime) {
        // Extension unavailable — AI already switched server-side, just refresh
        isSwitchingRef.current = false
        setSwitching(false)
        router.refresh()
        return
      }

      // Timeout fallback: unblock UI if summary never arrives (~130 s)
      switchTimeoutRef.current = setTimeout(() => {
        if (isSwitchingRef.current) {
          isSwitchingRef.current = false
          setSwitching(false)
          router.refresh()
        }
      }, 130_000)

      const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID!
      window.chrome.runtime.sendMessage(
        extensionId,
        {
          type: 'SEND_MESSAGE',
          payload: {
            requestId: data.requestId,
            conversationId: conversation.id,
            aiProvider: data.previousAi,
            fullMessage: data.summaryPrompt,
            authToken: session.access_token,
            webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/summarize`,
          },
        },
        (response) => {
          if (window.chrome.runtime.lastError || !response?.requestId) {
            // Extension rejected — unblock immediately
            clearTimeout(switchTimeoutRef.current ?? undefined)
            isSwitchingRef.current = false
            setSwitching(false)
            router.refresh()
          }
          // Otherwise banner stays up; Realtime dismisses it when summary arrives
        }
      )
    } catch {
      isSwitchingRef.current = false
      setSwitching(false)
      router.refresh()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {switching && <ContextSwitchBanner />}
      <MessageList messages={messages} />
      <div ref={bottomRef} />
      {extensionError && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{extensionError}</span>
          <Link href="/settings/extension" className="underline opacity-80 hover:opacity-100">
            Settings →
          </Link>
        </div>
      )}
      <InputBar
        conversationId={conversation.id}
        currentAI={conversation.current_ai as AIProvider}
        isSending={isSending}
        isSwitching={switching}
        onSend={handleSend}
        onSwitchAI={handleSwitchAI}
      />
    </div>
  )
}
