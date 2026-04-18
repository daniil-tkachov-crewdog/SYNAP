'use client'

import { BrainIcon } from 'lucide-react'
import { useMemoryFacts } from '@/hooks/useMemory'
import { MemoryFactCard } from './MemoryFactCard'
import { AddFactForm } from './AddFactForm'
import type { MemoryFact } from '@synap/types'

interface Props {
  initialFacts: MemoryFact[]
}

const CATEGORY_ORDER = ['personal', 'professional', 'preferences', 'custom'] as const

export function MemoryPage({ initialFacts }: Props) {
  const { data: facts = initialFacts } = useMemoryFacts()

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = facts.filter((f) => f.category === cat)
      return acc
    },
    {} as Record<string, MemoryFact[]>
  )

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <BrainIcon className="h-5 w-5 text-synap-500" />
          <h1 className="text-2xl font-bold text-white">Memory</h1>
        </div>
        <p className="mb-8 text-sm text-slate-400">
          Facts stored here are automatically injected into the beginning of every AI conversation,
          so every AI always knows your context.
        </p>

        {facts.length === 0 ? (
          <div className="mb-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="mb-1 text-sm font-medium text-white">No facts yet</p>
            <p className="mb-4 text-xs text-slate-500">
              Add your name, job, preferences — anything you always want AIs to know.
            </p>
          </div>
        ) : (
          <div className="mb-6 space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat]
              if (!items?.length) return null
              return (
                <div key={cat}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {cat}
                  </h2>
                  <div className="space-y-2">
                    {items.map((fact) => (
                      <MemoryFactCard key={fact.id} fact={fact} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <AddFactForm />
      </div>
    </div>
  )
}
