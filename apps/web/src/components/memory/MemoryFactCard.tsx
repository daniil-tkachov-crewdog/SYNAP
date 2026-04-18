'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateMemoryFact, useDeleteMemoryFact } from '@/hooks/useMemory'
import type { MemoryFact } from '@synap/types'

interface Props {
  fact: MemoryFact
}

export function MemoryFactCard({ fact }: Props) {
  const [editing, setEditing] = useState(false)
  const [key, setKey] = useState(fact.key)
  const [value, setValue] = useState(fact.value)

  const update = useUpdateMemoryFact()
  const remove = useDeleteMemoryFact()

  async function handleSave() {
    await update.mutateAsync({ id: fact.id, key, value })
    setEditing(false)
  }

  async function handleToggle() {
    await update.mutateAsync({ id: fact.id, isActive: !fact.isActive })
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border px-4 py-3 transition',
        fact.isActive
          ? 'border-white/10 bg-white/5'
          : 'border-white/5 bg-transparent opacity-50'
      )}
    >
      {/* Toggle */}
      <button
        onClick={handleToggle}
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0 rounded border transition',
          fact.isActive
            ? 'border-synap-500 bg-synap-600'
            : 'border-white/20 bg-transparent'
        )}
        title={fact.isActive ? 'Disable this fact' : 'Enable this fact'}
      >
        {fact.isActive && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>

      {editing ? (
        <div className="flex flex-1 flex-col gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-synap-500"
            placeholder="Key (e.g. name)"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-synap-500"
            placeholder="Value"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-synap-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-synap-700 disabled:opacity-50"
            >
              <Check className="h-3 w-3" /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setKey(fact.key); setValue(fact.value) }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/5"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-start justify-between gap-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {fact.key}
            </span>
            <p className="mt-0.5 text-sm text-white">{fact.value}</p>
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => remove.mutate(fact.id)}
              disabled={remove.isPending}
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
