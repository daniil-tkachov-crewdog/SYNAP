import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ExtensionWebhookPayload } from '@synap/types'
import type { Database } from '@synap/db'
import { generateId } from '@/lib/utils'

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const payload: ExtensionWebhookPayload = await request.json()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', payload.conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Ignore partial chunks — we only store the final summary
  if (payload.isPartial) {
    return NextResponse.json({ ok: true })
  }

  if (payload.isError) {
    // Insert a visible notice so the user knows context wasn't carried
    await supabase.from('messages').insert({
      id: generateId(),
      conversation_id: payload.conversationId,
      user_id: user.id,
      role: 'system',
      content: `⚠️ Could not carry context from ${payload.aiProvider} — summarization failed.`,
      is_context_summary: false,
      metadata: { error: true },
    })
    return NextResponse.json({ ok: true })
  }

  // Insert the summary as a system message; Realtime dismisses the banner in ChatWindow
  await supabase.from('messages').insert({
    id: payload.requestId,
    conversation_id: payload.conversationId,
    user_id: user.id,
    role: 'system',
    content: payload.content,
    is_context_summary: true,
    metadata: { fromAi: payload.aiProvider },
  })

  return NextResponse.json({ ok: true })
}
