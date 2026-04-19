'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AI_PROVIDERS } from '@synap/types'
import type { AIProvider } from '@synap/types'

interface Props {
  value: AIProvider
  onChange: (ai: AIProvider) => void
  disabled?: boolean
}

export function ModelSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const current = AI_PROVIDERS[value]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-40',
        )}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: current.color }}
        />
        {current.name}
        <ChevronDownIcon className="h-3.5 w-3.5 text-white/50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
            {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((provider) => {
              const info = AI_PROVIDERS[provider]
              const isActive = provider === value
              return (
                <button
                  key={provider}
                  onClick={() => {
                    setOpen(false)
                    if (provider !== value) onChange(provider)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-white/5',
                    isActive ? 'text-white' : 'text-white/70'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  {info.name}
                  {isActive && <span className="ml-auto text-xs text-white/30">active</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
