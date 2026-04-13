import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import type { UserProfile, Department } from '@/types'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('user_profiles')
    .select('*, department:departments(*)')
    .eq('id', user.id)
    .single()

  const profile = profileRes.data as UserProfile
  const [posRes, deptRes] = await Promise.all([
    supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
    supabase.from('departments').select('*').is('parent_id', null).order('name'),
  ])
  const allPOs = posRes.data || []
  const depts  = deptRes.data || []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title="Analytics"
          departmentName={profile.department?.name || 'Ole Miss Athletics'}
          roleLabel={profile.role.replace('_', ' ')}
        />
        <AnalyticsClient pos={allPOs} departments={depts} />
      </main>
    </div>
  )
}
