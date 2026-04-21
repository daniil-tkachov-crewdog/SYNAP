import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AI_PROVIDERS, type AIProvider } from '@synap/types'

interface SynapAuth {
  accessToken: string
  refreshToken: string
  supabaseUrl: string
  supabaseAnonKey: string
  appUrl: string
}

interface DbMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  ai_provider: string | null
  created_at: string
  is_context_summary?: boolean
}

const AI_LIST = Object.entries(AI_PROVIDERS) as [AIProvider, (typeof AI_PROVIDERS)[AIProvider]][]

function generateId() {
  return crypto.randomUUID()
}

export function SidebarApp() {
  const [auth, setAuth] = useState<SynapAuth | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DbMessage[]>([])
  const [activeAI, setActiveAI] = useState<AIProvider>('chatgpt')
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [memoryCount, setMemoryCount] = useState(0)
  const [aiPickerOpen, setAiPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const realtimeRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null)

  // Load auth from chrome.storage.local on mount
  useEffect(() => {
    chrome.storage.local.get('synapAuth', ({ synapAuth }) => {
      if (!synapAuth) return
      setAuth(synapAuth as SynapAuth)
    })

    // Listen for auth updates while sidebar is open
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.synapAuth?.newValue) {
        setAuth(changes.synapAuth.newValue as SynapAuth)
      }
    }
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [])

  // Init Supabase client when auth arrives
  useEffect(() => {
    if (!auth) return
    const client = createClient(auth.supabaseUrl, auth.supabaseAnonKey, {
      auth: { persistSession: false },
    })
    client.auth.setSession({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
    })
    setSupabase(client)
  }, [auth])

  // Load last conversation + memory count when Supabase ready
  useEffect(() => {
    if (!supabase || !auth) return

    chrome.storage.local.get('lastConversationId', async ({ lastConversationId: lastId }) => {
      if (lastId) {
        await loadConversation(lastId)
      }
    })

    fetchMemoryCount()
  }, [supabase, auth])

  const fetchMemoryCount = useCallback(async () => {
    if (!auth) return
    try {
      const res = await fetch(`${auth.appUrl}/api/memory`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      })
      if (res.ok) {
        const facts = await res.json()
        const active = Array.isArray(facts) ? facts.filter((f: { is_active: boolean }) => f.is_active).length : 0
        setMemoryCount(active)
      }
    } catch {}
  }, [auth])

  const subscribeToConversation = useCallback(
    (convId: string, client: SupabaseClient) => {
      if (realtimeRef.current) {
        client.removeChannel(realtimeRef.current)
      }
      const channel = client
        .channel(`sidebar-messages-${convId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => {
            const msg = payload.new as DbMessage
            if (!msg?.id) return
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === msg.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = msg
                return next
              }
              return [...prev, msg]
            })
          }
        )
        .subscribe()
      realtimeRef.current = channel
    },
    []
  )

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!supabase || !auth) return
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as DbMessage[])
      setConversationId(convId)
      subscribeToConversation(convId, supabase)
    },
    [supabase, auth, subscribeToConversation]
  )

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !auth || isSending) return
    setIsSending(true)
    setError(null)

    try {
      let convId = conversationId

      // Create conversation if needed
      if (!convId) {
        const res = await fetch(`${auth.appUrl}/api/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({ aiProvider: activeAI }),
        })
        if (!res.ok) throw new Error('Failed to create conversation')
        const conv = await res.json()
        convId = conv.id
        setConversationId(convId)
        chrome.storage.local.set({ lastConversationId: convId })
        if (supabase) subscribeToConversation(convId!, supabase)
      }

      // Optimistic user message
      const tempId = generateId()
      const optimistic: DbMessage = {
        id: tempId,
        conversation_id: convId!,
        role: 'user',
        content: input.trim(),
        ai_provider: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])
      const sentContent = input.trim()
      setInput('')

      // POST to messages API
      const msgRes = await fetch(`${auth.appUrl}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ content: sentContent, aiProvider: activeAI }),
      })
      if (!msgRes.ok) throw new Error('Failed to send message')
      const { requestId, fullMessage, userMessageId } = await msgRes.json()

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: userMessageId } : m))
      )

      // Trigger AI via extension background
      const webhookUrl = `${auth.appUrl}/api/webhooks/extension`
      chrome.runtime.sendMessage({
        type: 'SEND_MESSAGE',
        payload: {
          requestId,
          conversationId: convId,
          aiProvider: activeAI,
          fullMessage,
          authToken: auth.accessToken,
          webhookUrl,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSending(false)
    }
  }

  function handleNewChat() {
    if (realtimeRef.current && supabase) supabase.removeChannel(realtimeRef.current)
    setConversationId(null)
    setMessages([])
    setError(null)
    chrome.storage.local.remove('lastConversationId')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <span style={styles.logo}>Syn<span style={styles.logoAccent}>ap</span></span>
        </div>
        <div style={styles.unauthBody}>
          <p style={styles.unauthText}>Sign in to Synap to use the sidebar.</p>
          <button style={styles.primaryBtn} onClick={() => chrome.tabs.create({ url: 'https://synap.app' })}>
            Open Synap →
          </button>
        </div>
      </div>
    )
  }

  // ── Main chat UI ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>Syn<span style={styles.logoAccent}>ap</span></span>

        {/* AI picker */}
        <div style={{ position: 'relative' }}>
          <button
            style={{ ...styles.aiPickerBtn, borderColor: AI_PROVIDERS[activeAI].color }}
            onClick={() => setAiPickerOpen((o) => !o)}
          >
            <span style={{ color: AI_PROVIDERS[activeAI].color, fontSize: '8px', marginRight: '4px' }}>●</span>
            {AI_PROVIDERS[activeAI].name}
            <span style={{ marginLeft: '4px', opacity: 0.5 }}>▾</span>
          </button>
          {aiPickerOpen && (
            <div style={styles.aiDropdown}>
              {AI_LIST.map(([key, meta]) => (
                <button
                  key={key}
                  style={{
                    ...styles.aiDropdownItem,
                    ...(key === activeAI ? styles.aiDropdownItemActive : {}),
                  }}
                  onClick={() => {
                    setActiveAI(key)
                    setAiPickerOpen(false)
                  }}
                >
                  <span style={{ color: meta.color, fontSize: '8px', marginRight: '6px' }}>●</span>
                  {meta.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button style={styles.fullViewBtn} onClick={() => chrome.tabs.create({ url: `${auth.appUrl}/chat` })}>
          Full ↗
        </button>
      </div>

      {/* Memory indicator */}
      {memoryCount > 0 && (
        <div style={styles.memoryBar}>
          <span style={{ color: '#818cf8', marginRight: '4px' }}>●</span>
          {memoryCount} memory fact{memoryCount !== 1 ? 's' : ''} active
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button style={styles.errorDismiss} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ marginBottom: '8px' }}>Ask anything across all your AIs.</p>
            <p style={{ fontSize: '11px', color: '#475569' }}>
              Using {AI_PROVIDERS[activeAI].name}. Switch AI above.
            </p>
          </div>
        )}
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI),
              }}
            >
              {msg.role === 'assistant' && msg.ai_provider && (
                <div style={{ ...styles.aiLabel, color: AI_PROVIDERS[msg.ai_provider as AIProvider]?.color ?? '#94a3b8' }}>
                  {AI_PROVIDERS[msg.ai_provider as AIProvider]?.name ?? msg.ai_provider}
                </div>
              )}
              <div style={styles.bubbleContent}>{msg.content}</div>
            </div>
          ))}
        {isSending && (
          <div style={{ ...styles.bubble, ...styles.bubbleAI }}>
            <div style={styles.aiLabel}>Waiting…</div>
            <div style={{ ...styles.bubbleContent, color: '#64748b' }}>▋</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${AI_PROVIDERS[activeAI].name}…`}
            rows={3}
            disabled={isSending}
            style={{ ...styles.textarea, opacity: isSending ? 0.5 : 1 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || isSending ? 0.4 : 1,
              cursor: !input.trim() || isSending ? 'default' : 'pointer',
            }}
          >
            ↑
          </button>
        </div>
        <button style={styles.newChatBtn} onClick={handleNewChat} disabled={isSending}>
          + New chat
        </button>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderBottom: '1px solid #1e293b',
    flexShrink: 0,
  },
  logo: {
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    color: '#6366f1',
  },
  aiPickerBtn: {
    display: 'flex',
    alignItems: 'center',
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  aiDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 100,
    minWidth: '130px',
  },
  aiDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#cbd5e1',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '6px',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  aiDropdownItemActive: {
    background: '#0f172a',
    color: '#f8fafc',
  },
  fullViewBtn: {
    marginLeft: 'auto',
    background: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  memoryBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 12px',
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
    fontSize: '11px',
    color: '#64748b',
    flexShrink: 0,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#7c2d12',
    color: '#fca5a5',
    fontSize: '12px',
    flexShrink: 0,
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: '12px',
    padding: 0,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyState: {
    margin: 'auto',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '12px',
    lineHeight: 1.6,
  },
  bubble: {
    maxWidth: '92%',
    borderRadius: '10px',
    padding: '8px 10px',
    wordBreak: 'break-word',
    lineHeight: 1.55,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    background: '#4f46e5',
    color: '#fff',
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    background: '#1e293b',
    color: '#f1f5f9',
  },
  aiLabel: {
    fontSize: '10px',
    fontWeight: 600,
    marginBottom: '4px',
    opacity: 0.8,
  },
  bubbleContent: {
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    padding: '10px 12px',
    borderTop: '1px solid #1e293b',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  sendBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    width: '34px',
    height: '34px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  newChatBtn: {
    background: 'none',
    border: '1px solid #334155',
    color: '#64748b',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
  },
  unauthBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px',
  },
  unauthText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  primaryBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
