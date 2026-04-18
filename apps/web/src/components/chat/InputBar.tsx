'use client'

import { useRef, useState } from 'react'
import { SendIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModelSelector } from './ModelSelector'
import { StreamingIndicator } from './StreamingIndicator'
import { AI_PROVIDERS } from '@synap/types'
import type { AIProvider } from '@synap/types'

interface Props {
  conversationId: string
  currentAI: AIProvider
  isSending: boolean
  onSend: (content: string, aiProvider: AIProvider) => void
  onSwitchAI: (newAI: AIProvider) => void
}

export function InputBar({ currentAI, isSending, onSend, onSwitchAI }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || isSending) return
    onSend(trimmed, currentAI)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  const aiInfo = AI_PROVIDERS[currentAI]

  return (
    <div className="border-t border-white/10 px-4 py-4">
      {isSending && <StreamingIndicator aiName={aiInfo.name} />}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <ModelSelector value={currentAI} onChange={onSwitchAI} disabled={isSending} />
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${aiInfo.name}…`}
            rows={1}
            disabled={isSending}
            className={cn(
              'w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-synap-500 focus:ring-1 focus:ring-synap-500 disabled:opacity-50',
              'max-h-[200px] overflow-y-auto'
            )}
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-synap-600 text-white transition hover:bg-synap-700 disabled:opacity-30"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
      <p className="mt-2 text-center text-xs text-slate-600">
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  )
}
