import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBearerClient, extractBearerToken } from '@/lib/supabase/fromBearer'
import type { SendMessageRequest, SendMessageResponse } from '@synap/types'
import { generateId } from '@/lib/utils'

async function buildMemoryPrefix(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  const { data: facts } = await supabase
    .from('memory_facts')
    .select('key, value, category')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('category')

  if (!facts?.length) return ''

  const lines = facts.map((f) => `- ${f.key}: ${f.value}`).join('\n')
  return `[About the user — keep this in mind throughout our conversation]\n${lines}\n\n`
}

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params
  const token = extractBearerToken(req)
  const supabase = token ? createBearerClient(token) : await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const { id: conversationId } = await params
  const token = extractBearerToken(request)
  const supabase = token ? createBearerClient(token) : await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SendMessageRequest = await request.json()

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Build memory prefix if this is the first message
  let memoryPrefix = ''
  let memoryInjected = conversation.memory_injected

  if (!conversation.memory_injected) {
    memoryPrefix = await buildMemoryPrefix(supabase, user.id)
    if (memoryPrefix) {
      memoryInjected = true
    }
  }

  const fullMessage = memoryPrefix ? `${memoryPrefix}${body.content}` : body.content

  // Insert user message
  const { data: userMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      id: generateId(),
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: body.content,
      ai_provider: null,
    })
    .select()
    .single()

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  // Update conversation
  await supabase
    .from('conversations')
    .update({
      current_ai: body.aiProvider,
      memory_injected: memoryInjected,
      last_message_at: new Date().toISOString(),
      title: conversation.title ?? body.content.slice(0, 50),
    })
    .eq('id', conversationId)

  const requestId = generateId()

  const response: SendMessageResponse = {
    requestId,
    userMessageId: userMessage.id,
    memoryInjected: !conversation.memory_injected && memoryInjected,
  }

  // Return requestId + fullMessage for the extension to use
  return NextResponse.json({
    ...response,
    fullMessage,
    aiProvider: body.aiProvider,
    conversationId,
  })
}
