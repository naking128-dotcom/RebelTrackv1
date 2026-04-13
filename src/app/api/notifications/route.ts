import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/notifications — system settings + current user prefs
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [settingsRes, prefsRes] = await Promise.all([
    supabase.from('notification_settings').select('*').order('event'),
    supabase.from('notification_preferences').select('*').eq('user_id', user.id),
  ])

  return NextResponse.json({
    settings: settingsRes.data ?? [],
    prefs:    prefsRes.data ?? [],
  })
}

// POST /api/notifications — toggle system event or user preference
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    type: 'system' | 'user'
    event: string
    enabled: boolean
  }
  const { type, event, enabled } = body

  if (!event || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'event and enabled are required' }, { status: 400 })
  }

  if (type === 'system') {
    // Only IT admins / business office may change system-wide settings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['it_admin', 'business_office'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('notification_settings')
      .upsert(
        { event, enabled, updated_at: new Date().toISOString() },
        { onConflict: 'event' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, type: 'system', event, enabled })
  }

  // User preference
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: user.id, event, enabled },
      { onConflict: 'user_id,event' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, type: 'user', event, enabled })
}
