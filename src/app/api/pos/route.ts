import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import {
  sendPOCreatedEmail,
  sendStatusChangeEmail,
} from '@/lib/email'
import type { CreatePOInput, UpdatePOStatusInput, POStatus } from '@/types'

// ============================================================
// GET /api/pos — list with filters
// ============================================================
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const dept   = searchParams.get('department_id')
  const status = searchParams.get('status')
  const year   = searchParams.get('year')
  const month  = searchParams.get('month')
  const search = searchParams.get('search')
  const warranty = searchParams.get('has_warranty')

  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      vendor:vendors(vendor_id, name),
      department:departments(name, parent_id),
      documents:po_documents(*)
    `)
    .order('created_at', { ascending: false })

  if (dept)     query = query.eq('department_id', dept)
  if (status)   query = query.eq('status', status)
  if (year)     query = query.gte('created_at', `${year}-01-01`).lte('created_at', `${year}-12-31`)
  if (month && year) {
    const m = month.padStart(2, '0')
    query = query
      .gte('created_at', `${year}-${m}-01`)
      .lte('created_at', `${year}-${m}-31`)
  }
  if (search) {
    query = query.or(
      `po_number.ilike.%${search}%,` +
      `vendor_name.ilike.%${search}%,` +
      `item_description.ilike.%${search}%,` +
      `department_name.ilike.%${search}%,` +
      `requester_name.ilike.%${search}%`
    )
  }
  if (warranty === 'true') query = query.eq('has_warranty', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// ============================================================
// POST /api/pos — create new PO
// ============================================================
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreatePOInput = await request.json()

  // Duplicate PO check
  const { data: dupCheck } = await supabase
    .rpc('check_duplicate_po', { p_po_number: body.po_number })
  if (dupCheck) {
    return NextResponse.json(
      { error: `PO number ${body.po_number} already exists`, code: 'DUPLICATE_PO' },
      { status: 409 }
    )
  }

  // Validate required fields
  const required = ['po_number', 'requester_name', 'department_name', 'vendor_name', 'item_description']
  for (const field of required) {
    if (!body[field as keyof CreatePOInput]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  // Insert PO
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({ ...body, created_by: user.id })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Audit entry
  await admin.from('po_audit_log').insert({
    po_id: po.id,
    field_changed: 'status',
    old_value: null,
    new_value: 'PO Created',
    changed_by: user.id,
    changed_by_name: 'system',
    note: 'PO created',
  })

  // Gather recipients
  const recipients = await getNotificationRecipients(supabase, po.department_id, 'po_created')
  const extra = body.extra_email_recipients || []
  const allRecipients = [...new Set([...recipients, ...extra])].filter(Boolean)

  // Send email if system setting allows
  const { data: setting } = await supabase
    .from('notification_settings')
    .select('enabled')
    .eq('event', 'po_created')
    .single()

  if (setting?.enabled && allRecipients.length > 0) {
    await sendPOCreatedEmail(po, allRecipients)
    await admin.from('notification_log').insert({
      po_id: po.id,
      event: 'po_created',
      recipients: allRecipients,
      subject: `[RebelTrack] New PO Created — ${po.po_number}`,
    })
  }

  return NextResponse.json(po, { status: 201 })
}

// ============================================================
// PATCH /api/pos — update status or fields
// ============================================================
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdatePOStatusInput & { id: string } = await request.json()
  const { id, ...updates } = body

  // Get current PO
  const { data: current } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!current) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

  // Enforce valid status progression
  if (updates.status) {
    const STATUS_FLOW: POStatus[] = [
      'PO Created','Ordered','Shipped','Delivered','Received','Asset Tagged','Closed'
    ]
    const currentIdx = STATUS_FLOW.indexOf(current.status)
    const newIdx     = STATUS_FLOW.indexOf(updates.status as POStatus)
    if (newIdx < currentIdx) {
      return NextResponse.json(
        { error: 'Cannot move status backwards', code: 'INVALID_STATUS_TRANSITION' },
        { status: 400 }
      )
    }
  }

  // Apply update
  const { data: updated, error } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Audit
  if (updates.status && updates.status !== current.status) {
    await admin.from('po_audit_log').insert({
      po_id: id,
      field_changed: 'status',
      old_value: current.status,
      new_value: updates.status,
      changed_by: user.id,
      changed_by_name: user.email,
    })

    // Email notification
    const eventMap: Partial<Record<POStatus, string>> = {
      'Ordered':      'status_ordered',
      'Shipped':      'status_shipped',
      'Delivered':    'status_delivered',
      'Received':     'status_received',
      'Asset Tagged': 'status_asset_tagged',
      'Closed':       'status_closed',
    }
    const event = eventMap[updates.status as POStatus]
    if (event) {
      const { data: setting } = await admin
        .from('notification_settings')
        .select('enabled')
        .eq('event', event)
        .single()

      if (setting?.enabled) {
        const recipients = await getNotificationRecipients(supabase, current.department_id, event)
        const extra = current.extra_email_recipients || []
        const allRecipients = [...new Set([...recipients, ...extra])].filter(Boolean)

        if (allRecipients.length > 0) {
          await sendStatusChangeEmail(updated, current.status, updates.status as POStatus, allRecipients)
          await admin.from('notification_log').insert({
            po_id: id,
            event,
            recipients: allRecipients,
            subject: `[RebelTrack] PO ${updated.po_number} — Status Updated to ${updates.status}`,
          })
        }
      }
    }
  }

  return NextResponse.json(updated)
}

// ============================================================
// Helper: get notification recipients by dept + event
// ============================================================
async function getNotificationRecipients(
  supabase: ReturnType<typeof createClient>,
  departmentId: string | null,
  event: string
): Promise<string[]> {
  // Get users subscribed to this event
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, user_profiles!inner(email, role, department_id, is_active)')
    .eq('event', event)
    .eq('enabled', true)

  if (!prefs) return []

  return prefs
    .filter((p: Record<string, unknown>) => {
      const up = p.user_profiles as Record<string, unknown> | null
      if (!up) return false
      if (!up.is_active) return false
      if (['it_admin', 'business_office'].includes(String(up.role))) return true
      if (departmentId && up.department_id === departmentId) return true
      return false
    })
    .map((p: Record<string, unknown>) => {
      const up = p.user_profiles as Record<string, unknown> | null
      return String(up?.email ?? '')
    })
    .filter(Boolean)
}
