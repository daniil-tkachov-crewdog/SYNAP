import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBearerClient, extractBearerToken } from '@/lib/supabase/fromBearer'
import type { CreateMemoryFactRequest } from '@synap/types'

export async function GET(request: Request) {
  const token = extractBearerToken(request)
  const supabase = token ? createBearerClient(token) : await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('memory_facts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateMemoryFactRequest = await request.json()

  if (!body.key?.trim() || !body.value?.trim()) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('memory_facts')
    .insert({
      user_id: user.id,
      category: body.category ?? 'custom',
      key: body.key.trim(),
      value: body.value.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
