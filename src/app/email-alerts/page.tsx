import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import EmailAlertsClient from './EmailAlertsClient'
import type { UserProfile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EmailAlertsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, settingsRes, prefsRes] = await Promise.all([
    supabase.from('user_profiles').select('*, department:departments(*)').eq('id', user.id).single(),
    supabase.from('notification_settings').select('*').order('event'),
    supabase.from('notification_preferences').select('*').eq('user_id', user.id),
  ])

  const profile  = profileRes.data as UserProfile
  const settings = settingsRes.data ?? []
  const prefs    = prefsRes.data ?? []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Email Alerts" departmentName={profile.department?.name ?? 'Ole Miss Athletics'} roleLabel={profile.role.replace('_', ' ')} />
        <EmailAlertsClient settings={settings} prefs={prefs} profile={profile} />
      </main>
    </div>
  )
}
