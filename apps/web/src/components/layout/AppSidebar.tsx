'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, BrainIcon, SettingsIcon, MessageSquareIcon, LogOutIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ExtensionStatusBadge } from './ExtensionStatusBadge'
import type { Conversation } from '@synap/types'

interface Props {
  userId: string
}

export function AppSidebar({ userId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json()
    },
  })

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProvider: 'chatgpt' }),
      })
      if (!res.ok) throw new Error('Failed to create conversation')
      return res.json() as Promise<Conversation>
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId] })
      router.push(`/chat/${conversation.id}`)
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
      <div className="px-3 pb-3">
        <button
          onClick={() => createConversation.mutate()}
          disabled={createConversation.isPending}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <PlusIcon className="h-4 w-4" />
          New chat
        </button>
      </div>

      {/* Conversations */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
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
