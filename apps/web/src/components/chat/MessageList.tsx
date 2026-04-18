import { MessageBubble } from './MessageBubble'
import type { Database } from '@synap/db'

type DbMessage = Database['public']['Tables']['messages']['Row']

interface Props {
  messages: DbMessage[]
}

export function MessageList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-3xl">✨</p>
        <p className="text-sm text-slate-400">Start the conversation below</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}
