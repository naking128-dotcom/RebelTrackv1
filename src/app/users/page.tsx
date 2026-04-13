import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import type { UserProfile, Department } from '@/types'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRes = await supabase
    .from('user_profiles')
    .select('*, department:departments(*)')
    .eq('id', user.id)
    .single()

  const profile = profileRes.data as UserProfile
  const [usersRes, deptRes] = await Promise.all([
    supabase.from('user_profiles').select('*, department:departments(name)').order('first_name'),
    supabase.from('departments').select('*').order('name'),
  ])
  const users = usersRes.data || []
  const depts = deptRes.data || []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title="Users & Roles"
          departmentName={profile.department?.name || 'Ole Miss Athletics'}
          roleLabel={profile.role.replace('_', ' ')}
        />
        <UsersClient users={users} departments={depts} />
      </main>
    </div>
  )
}
