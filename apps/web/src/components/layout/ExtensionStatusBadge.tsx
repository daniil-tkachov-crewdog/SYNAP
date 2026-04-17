'use client'

import { useExtension } from '@/hooks/useExtension'
import { cn } from '@/lib/utils'

export function ExtensionStatusBadge() {
  const { isConnected } = useExtension()

  return (
    <span
      title={isConnected ? 'Extension connected' : 'Extension not detected'}
      className={cn(
        'ml-auto inline-flex h-2 w-2 rounded-full',
        isConnected ? 'bg-green-500' : 'bg-slate-600'
      )}
    />
  )
}
