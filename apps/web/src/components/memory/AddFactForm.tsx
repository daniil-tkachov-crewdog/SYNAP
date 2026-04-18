'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { useCreateMemoryFact } from '@/hooks/useMemory'
import type { MemoryCategory } from '@synap/types'

const CATEGORIES: { value: MemoryCategory; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'professional', label: 'Professional' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'custom', label: 'Custom' },
]

export function AddFactForm() {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<MemoryCategory>('personal')

  const create = useCreateMemoryFact()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim() || !value.trim()) return
    await create.mutateAsync({ key: key.trim(), value: value.trim(), category })
    setKey('')
    setValue('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-white/50 transition hover:border-white/20 hover:text-white/70"
      >
        <PlusIcon className="h-4 w-4" />
        Add a fact
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-synap-500/30 bg-synap-500/5 p-4">
      <div className="mb-3 flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-lg px-3 py-1 text-xs transition ${
              category === c.value
                ? 'bg-synap-600 text-white'
                : 'border border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key (e.g. name, job, timezone)"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-synap-500"
          required
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-synap-500"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-synap-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-synap-700 disabled:opacity-50"
        >
          {create.isPending ? 'Adding…' : 'Add fact'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
