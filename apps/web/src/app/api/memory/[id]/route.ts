import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMemoryFactRequest, MemoryFact } from '@synap/types'

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

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateMemoryFactRequest = await request.json()

  const { data, error } = await supabase
    .from('memory_facts')
    .update({
      ...(body.key !== undefined && { key: body.key }),
      ...(body.value !== undefined && { value: body.value }),
      ...(body.isActive !== undefined && { is_active: body.isActive }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toMemoryFact(data))
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('memory_facts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
