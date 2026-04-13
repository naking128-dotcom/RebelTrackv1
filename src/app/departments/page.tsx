import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import type { UserProfile, Department } from '@/types'
import DepartmentsClient from './DepartmentsClient'

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('user_profiles')
    .select('*, department:departments(*)')
    .eq('id', user.id)
    .single()

  const profile = profileRes.data as UserProfile
  const deptRes = await supabase
    .from('departments')
    .select('*, parent:departments!parent_id(name), children:departments!parent_id(*)')
    .order('sort_order')
    .order('name')
  const depts = deptRes.data || []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title="Departments"
          departmentName={profile.department?.name || 'Ole Miss Athletics'}
          roleLabel={profile.role.replace('_', ' ')}
        />
        <DepartmentsClient departments={depts} />
      </main>
    </div>
  )
}
