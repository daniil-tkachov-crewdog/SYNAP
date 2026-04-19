import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIProvider } from '@synap/types'
import { generateId } from '@/lib/utils'

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

  const { data: conversation } = await supabase
    .from('conversations')
    .select('current_ai')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const previousAi = conversation.current_ai as AIProvider

  // Fetch last 20 non-summary messages to build the transcript
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_context_summary', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Switch the AI immediately — summary will arrive asynchronously via webhook
  await supabase
    .from('conversations')
    .update({ current_ai: body.newAiProvider, memory_injected: false })
    .eq('id', conversationId)

  if (!messages?.length) {
    return NextResponse.json({ skipSummary: true })
  }

  const chronological = [...messages].reverse()
  const transcript = chronological
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n')

  const summaryPrompt =
    `Here is a conversation between a user and an AI assistant:\n\n${transcript}\n\n` +
    `Please summarize this conversation in 2–3 paragraphs. Include: what the user was trying to ` +
    `accomplish, any key decisions or conclusions, and important technical details or code discussed. ` +
    `Write it as context for a different AI assistant who will continue helping the user. ` +
    `Be concise but complete. Start directly with the summary — no preamble.`

  return NextResponse.json({
    requestId: generateId(),
    summaryPrompt,
    previousAi,
  })
}
