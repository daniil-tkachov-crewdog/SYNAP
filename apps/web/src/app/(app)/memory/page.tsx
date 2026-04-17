import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemoryPage } from '@/components/memory/MemoryPage'

export default async function MemoryRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: facts } = await supabase
    .from('memory_facts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <MemoryPage initialFacts={facts ?? []} />
}
