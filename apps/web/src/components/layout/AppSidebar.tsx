'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, BrainIcon, SettingsIcon, MessageSquareIcon, LogOutIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AI_PROVIDERS } from '@synap/types'
import { ExtensionStatusBadge } from './ExtensionStatusBadge'
import type { Conversation, AIProvider } from '@synap/types'

const MVP_PROVIDERS: AIProvider[] = ['chatgpt', 'claude']

interface Props {
  userId: string
}

export function AppSidebar({ userId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json()
    },
  })

  const createConversation = useMutation({
    mutationFn: async (aiProvider: AIProvider) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProvider }),
      })
      if (!res.ok) throw new Error('Failed to create conversation')
      return res.json() as Promise<Conversation>
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
      router.push(`/chat/${conversation.id}`)
      setPickerOpen(false)
    },
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="text-xl font-bold text-white">
          Syn<span className="text-synap-500">ap</span>
        </span>
        <ExtensionStatusBadge />
      </div>

      {/* New chat */}
      <div className="relative px-3 pb-3">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          disabled={createConversation.isPending}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          New chat
          <ChevronDownIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
        </button>

        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
            <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
              {MVP_PROVIDERS.map((provider) => {
                const info = AI_PROVIDERS[provider]
                return (
                  <button
                    key={provider}
                    onClick={() => createConversation.mutate(provider)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
                    {info.name}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Conversations */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <div className="space-y-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-full animate-pulse rounded-lg bg-white/5"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-4 text-xs text-white/30">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => {
              const isActive = pathname === `/chat/${conv.id}`
              return (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-synap-600/20 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <MessageSquareIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{conv.title ?? 'New conversation'}</span>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <Link
          href="/memory"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            pathname === '/memory'
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
        >
          <BrainIcon className="h-4 w-4" />
          Memory
        </Link>
        <Link
          href="/settings/extension"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
            pathname === '/settings/extension'
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
        >
          <SettingsIcon className="h-4 w-4" />
          Extension
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <LogOutIcon className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
