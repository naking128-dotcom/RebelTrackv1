import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'
import type { CreateUserInput } from '@/types'

// ============================================================
// GET /api/users
// ============================================================
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('user_profiles')
    .select('*, department:departments(name)')
    .order('first_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// ============================================================
// POST /api/users — IT admin creates account
// ============================================================
export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const body: CreateUserInput = await request.json()

  // Verify caller is IT admin using the cookie-based session (NOT service role)
  // admin.auth.getUser() always returns null for caller — it uses the service key.
  // We must use createClient() (anon key + cookies) to identify the real requester.
  const callerClient = createClient()
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await callerClient
    .from('user_profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'it_admin') {
    return NextResponse.json({ error: 'Only IT Admins can create users' }, { status: 403 })
  }

  // Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      first_name: body.first_name,
      last_name: body.last_name,
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Create profile
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .insert({
      id: authUser.user.id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      role: body.role,
      department_id: body.department_id || null,
      must_reset_pw: body.force_reset,
      is_active: true,
      created_by: caller?.id || null,
    })
    .select('*')
    .single()

  if (profileError) {
    // Clean up auth user if profile fails
    await admin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // Set default notification preferences
  const notifications = []
  if (body.notify_po_created)      notifications.push({ user_id: profile.id, event: 'po_created',     enabled: true })
  if (body.notify_status_changes) {
    for (const ev of ['status_ordered','status_shipped','status_delivered','status_received']) {
      notifications.push({ user_id: profile.id, event: ev, enabled: true })
    }
  }
  if (body.notify_warranty) {
    notifications.push({ user_id: profile.id, event: 'warranty_90_days',         enabled: true })
    notifications.push({ user_id: profile.id, event: 'warranty_30_days',         enabled: true })
    notifications.push({ user_id: profile.id, event: 'warranty_quarterly_digest',enabled: true })
  }

  if (notifications.length > 0) {
    await admin.from('notification_preferences').insert(notifications)
  }

  // Send welcome email
  const roleLabel: Record<string, string> = {
    it_admin:        'IT Admin',
    dept_admin:      'Department Admin',
    business_office: 'Business Office',
    read_only:       'Read Only',
  }
  await sendWelcomeEmail(
    body.email,
    body.first_name,
    body.password,
    roleLabel[body.role] || body.role
  )

  return NextResponse.json(profile, { status: 201 })
}

// ============================================================
// PATCH /api/users — update role, dept, active status
// ============================================================
export async function PATCH(request: NextRequest) {
  const admin = createAdminClient()
  const body = await request.json()
  const { id, password, ...updates } = body

  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  // Update profile
  const { data, error } = await admin
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Reset password if provided
  if (password) {
    const { error: pwError } = await admin.auth.admin.updateUserById(id, {
      password,
    })
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 400 })
    // Force reset on next login
    await admin
      .from('user_profiles')
      .update({ must_reset_pw: true })
      .eq('id', id)
  }

  return NextResponse.json(data)
}
