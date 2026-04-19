import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIProvider } from '@synap/types'

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

  // TODO Phase 6: real summarisation via extension
  await supabase
    .from('conversations')
    .update({
      current_ai: body.newAiProvider,
      memory_injected: false,
    })
    .eq('id', conversationId)

  return NextResponse.json({ ok: true })
}
