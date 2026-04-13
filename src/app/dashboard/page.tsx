import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import DashboardClient from './DashboardClient'
import type { UserProfile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, posRes, deptRes] = await Promise.all([
    supabase.from('user_profiles').select('*, department:departments(*)').eq('id', user.id).single(),
    supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
    supabase.from('departments').select('*').is('parent_id', null).order('name'),
  ])

  const profile  = profileRes.data as UserProfile
  const allPOs   = posRes.data || []
  const depts    = deptRes.data || []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Dashboard" departmentName={profile.department?.name || 'Ole Miss Athletics'} roleLabel={profile.role.replace('_', ' ')} />
        <DashboardClient pos={allPOs} departments={depts} profile={profile} />
      </main>
    </div>
  )
}
