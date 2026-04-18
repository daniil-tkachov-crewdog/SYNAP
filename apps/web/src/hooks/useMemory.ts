'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MemoryFact, CreateMemoryFactRequest, UpdateMemoryFactRequest } from '@synap/types'

export function useMemoryFacts() {
  return useQuery<MemoryFact[]>({
    queryKey: ['memory'],
    queryFn: async () => {
      const res = await fetch('/api/memory')
      if (!res.ok) throw new Error('Failed to fetch memory facts')
      return res.json()
    },
  })
}

export function useCreateMemoryFact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateMemoryFactRequest) => {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create fact')
      return res.json() as Promise<MemoryFact>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory'] }),
  })
}

export function useUpdateMemoryFact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateMemoryFactRequest & { id: string }) => {
      const res = await fetch(`/api/memory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update fact')
      return res.json() as Promise<MemoryFact>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory'] }),
  })
}

export function useDeleteMemoryFact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete fact')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory'] }),
  })
}
