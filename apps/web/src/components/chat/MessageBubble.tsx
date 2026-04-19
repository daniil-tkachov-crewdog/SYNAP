import { cn } from '@/lib/utils'
import { AI_PROVIDERS } from '@synap/types'
import type { Database } from '@synap/db'

type DbMessage = Database['public']['Tables']['messages']['Row']

interface Props {
  message: DbMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="max-w-lg rounded-xl border border-synap-500/20 bg-synap-500/10 px-4 py-2 text-xs text-synap-400">
          {message.content}
        </div>
      </div>
    )
  }

  const aiProvider = message.ai_provider
  const aiInfo = aiProvider ? AI_PROVIDERS[aiProvider as keyof typeof AI_PROVIDERS] : null

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isUser ? 'bg-synap-600 text-white' : 'bg-white/10 text-white/80'
        )}
        style={!isUser && aiInfo ? { backgroundColor: `${aiInfo.color}22`, color: aiInfo.color } : undefined}
      >
        {isUser ? 'U' : (aiInfo?.name?.[0] ?? 'AI')}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-synap-600 text-white rounded-tr-sm'
            : 'bg-white/8 text-white/90 rounded-tl-sm border border-white/10'
        )}
      >
        {!isUser && (message.metadata as Record<string, unknown>)?.pending === true ? (
          <span className="flex items-center gap-1 py-1">
            <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" />
          </span>
        ) : (
          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
        )}
        {!isUser && aiInfo && (
          <div className="mt-2 text-xs opacity-40">{aiInfo.name}</div>
        )}
      </div>
    </div>
  )
}
