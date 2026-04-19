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

  // Create a client authenticated with the user's JWT — RLS applies normally
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

  // Verify the conversation belongs to this user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', payload.conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  if (payload.isError) {
    // Insert an error message so the UI can show it
    await supabase.from('messages').insert({
      id: generateId(),
      conversation_id: payload.conversationId,
      user_id: user.id,
      role: 'assistant',
      content: `⚠️ Error from ${payload.aiProvider}: ${payload.errorMessage ?? 'Unknown error'}`,
      ai_provider: payload.aiProvider,
      metadata: { error: true, requestId: payload.requestId },
    })
    return NextResponse.json({ ok: true })
  }

  if (payload.isPartial) {
    // Upsert a pending message for streaming-like UX
    await supabase.from('messages').upsert(
      {
        id: payload.requestId,
        conversation_id: payload.conversationId,
        user_id: user.id,
        role: 'assistant',
        content: payload.content,
        ai_provider: payload.aiProvider,
        metadata: { pending: true, requestId: payload.requestId },
      },
      { onConflict: 'id' }
    )
    return NextResponse.json({ ok: true })
  }

  // Final response — insert permanent message
  // If a partial message exists with this requestId, replace it
  await supabase.from('messages').upsert(
    {
      id: payload.requestId,
      conversation_id: payload.conversationId,
      user_id: user.id,
      role: 'assistant',
      content: payload.content,
      ai_provider: payload.aiProvider,
      metadata: { requestId: payload.requestId },
    },
    { onConflict: 'id' }
  )

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', payload.conversationId)

  return NextResponse.json({ ok: true })
}
