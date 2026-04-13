import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import WarrantiesClient from './WarrantiesClient'
import type { UserProfile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function WarrantiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, posRes] = await Promise.all([
    supabase.from('user_profiles').select('*, department:departments(*)').eq('id', user.id).single(),
    supabase.from('purchase_orders').select('*').eq('has_warranty', true).order('warranty_end_date', { ascending: true }),
  ])

  const profile = profileRes.data as UserProfile
  const allPOs  = posRes.data ?? []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Warranties" departmentName={profile.department?.name ?? 'Ole Miss Athletics'} roleLabel={profile.role.replace('_', ' ')} />
        <WarrantiesClient pos={allPOs} profile={profile} />
      </main>
    </div>
  )
}
