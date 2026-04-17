import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ChatIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Find most recent conversation or go to new chat
  const { data: latest } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single()

  if (latest) {
    redirect(`/chat/${latest.id}`)
  }

  // No conversations yet — show empty state
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-4xl">💬</div>
      <h2 className="text-xl font-semibold text-white">Start a conversation</h2>
      <p className="max-w-sm text-sm text-slate-400">
        Choose an AI from the sidebar and start chatting. Synap will remember context across all
        your conversations.
      </p>
    </div>
  )
}
