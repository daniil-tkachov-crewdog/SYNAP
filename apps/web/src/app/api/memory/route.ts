import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateMemoryFactRequest, MemoryFact } from '@synap/types'

function toMemoryFact(row: {
  id: string; user_id: string; category: string; key: string;
  value: string; is_active: boolean; created_at: string; updated_at: string;
}): MemoryFact {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as MemoryFact['category'],
    key: row.key,
    value: row.value,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET() {
  const supabase = await createClient()
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
  return NextResponse.json(data.map(toMemoryFact))
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
  return NextResponse.json(toMemoryFact(data), { status: 201 })
}
