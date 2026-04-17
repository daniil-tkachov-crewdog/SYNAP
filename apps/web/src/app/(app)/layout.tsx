import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
        <AppSidebar userId={user.id} />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </QueryProvider>
  )
}
