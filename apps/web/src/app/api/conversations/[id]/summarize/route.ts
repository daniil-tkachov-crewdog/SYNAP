import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIProvider } from '@synap/types'
import { randomUUID } from 'crypto'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Params) {
  const { id: conversationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: { newAiProvider: AIProvider } = await request.json()

  // Get last 20 messages for summarization
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, ai_provider')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_context_summary', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages to summarize' }, { status: 400 })
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('current_ai')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const previousAi = conversation.current_ai
  const chronological = [...messages].reverse()

  // Build the summarization prompt — sent to the previous AI via the extension
  const conversationText = chronological
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n')

  const summaryPrompt =
    'Summarize the following conversation concisely. Focus on: what the user was trying to accomplish, key decisions made, important context, and any code or specific details discussed. Be brief but complete.\n\n' +
    conversationText

  // Generate a requestId — the webhook will upsert the summary message using this as the row ID
  const requestId = randomUUID()

  // Update conversation to new AI and reset memory injection before the client sends to extension
  await supabase
    .from('conversations')
    .update({
      current_ai: body.newAiProvider,
      memory_injected: false,
    })
    .eq('id', conversationId)

  return NextResponse.json({ requestId, summaryPrompt, previousAi })
}
