import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
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

  // Get last 20 messages for summarization
  const { data: messages } = await supabase
    .from('messages')
    .select('role,content,ai_provider')
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

  // Generate summary via OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const summaryPrompt = chronological
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Summarize the following conversation concisely. Focus on: what the user was trying to accomplish, key decisions made, important context, and any code or specific details discussed. Be brief but complete.',
      },
      { role: 'user', content: summaryPrompt },
    ],
    max_tokens: 500,
  })

  const summaryText = completion.choices[0]?.message.content ?? 'No summary available.'

  const summaryContent = `[Context carried over from previous conversation with ${previousAi}]\n${summaryText}`

  // Insert the context summary as a system message
  const { data: summaryMessage } = await supabase
    .from('messages')
    .insert({
      id: generateId(),
      conversation_id: conversationId,
      user_id: user.id,
      role: 'system',
      content: summaryContent,
      is_context_summary: true,
    })
    .select()
    .single()

  // Update conversation to new AI, reset memory_injected so memory re-injects
  await supabase
    .from('conversations')
    .update({
      current_ai: body.newAiProvider,
      memory_injected: false,
    })
    .eq('id', conversationId)

  return NextResponse.json({ summaryMessageId: summaryMessage?.id })
}
