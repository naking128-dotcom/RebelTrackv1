import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendStatusChangeEmail } from '@/lib/email'
import type { POStatus } from '@/types'

const STATUS_FLOW: POStatus[] = [
  'PO Created', 'Ordered', 'Shipped', 'Delivered',
  'Received', 'Asset Tagged', 'Closed',
]

// ============================================================
// GET /api/pos/[id] — fetch single PO with all relations
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      vendor:vendors(vendor_id, name),
      department:departments(name, parent_id),
      documents:po_documents(*),
      audit_log:po_audit_log(* order created_at.desc)
    `)
    .eq('id', params.id)
    .single()

  if (error || !po) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  return NextResponse.json(po)
}

// ============================================================
// PATCH /api/pos/[id] — update status, asset info, or fields
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get caller's profile for role check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, department_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

  // Fetch current PO
  const { data: current } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!current) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

  // Dept admin can only update their own department's POs
  if (profile.role === 'dept_admin' && current.department_id !== profile.department_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Read-only users cannot update anything
  if (profile.role === 'read_only') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as Record<string, unknown>
  const { note, ...updates } = body

  // Enforce forward-only status transitions
  if (typeof updates.status === 'string') {
    const currentIdx = STATUS_FLOW.indexOf(current.status as POStatus)
    const newIdx     = STATUS_FLOW.indexOf(updates.status as POStatus)
    if (newIdx === -1) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    if (newIdx < currentIdx) {
      return NextResponse.json(
        { error: 'Status cannot move backwards', code: 'INVALID_STATUS_TRANSITION' },
        { status: 400 }
      )
    }
  }

  // Closed POs: only IT admins can make any change
  if (current.status === 'Closed' && profile.role !== 'it_admin') {
    return NextResponse.json(
      { error: 'Only IT Admins can modify a Closed PO' },
      { status: 403 }
    )
  }

  // Apply update
  const { data: updated, error: updateError } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? 'Update failed' }, { status: 400 })
  }

  // Write audit log entry for status changes
  if (typeof updates.status === 'string' && updates.status !== current.status) {
    // Non-blocking — intentionally not awaited so a log failure never blocks the response.
    // Using void + async IIFE to avoid .catch() on PostgrestFilterBuilder.
    void (async () => {
      try {
        await admin.from('po_audit_log').insert({
          po_id:           params.id,
          field_changed:   'status',
          old_value:       current.status,
          new_value:       updates.status,
          changed_by:      user.id,
          changed_by_name: user.email ?? 'unknown',
          note:            typeof note === 'string' ? note : null,
        })
      } catch (_err) {
        // Audit log failure is non-fatal — log to server console only
        console.error('[audit_log] Failed to write audit entry:', _err)
      }
    })()

    // Send email notification (also non-blocking)
    void (async () => {
      try {
        const eventMap: Partial<Record<POStatus, string>> = {
          'Ordered':      'status_ordered',
          'Shipped':      'status_shipped',
          'Delivered':    'status_delivered',
          'Received':     'status_received',
          'Asset Tagged': 'status_asset_tagged',
          'Closed':       'status_closed',
        }
        const event = eventMap[updates.status as POStatus]
        if (!event) return

        const { data: setting } = await admin
          .from('notification_settings')
          .select('enabled')
          .eq('event', event)
          .single()

        if (!setting?.enabled) return

        const recipients = await getNotificationRecipients(
          supabase, current.department_id, event
        )
        const extra = (current.extra_email_recipients as string[] | null) ?? []
        const allRecipients = [...new Set([...recipients, ...extra])].filter(Boolean)

        if (allRecipients.length > 0) {
          await sendStatusChangeEmail(
            updated,
            current.status as POStatus,
            updates.status as POStatus,
            allRecipients
          )
          // Use await + try/catch — no .catch() on Postgrest builder
          await admin.from('notification_log').insert({
            po_id:      params.id,
            event,
            recipients: allRecipients,
            subject:    `[RebelTrack] PO ${updated.po_number} — Status Updated to ${updates.status}`,
          })
        }
      } catch (_err) {
        console.error('[notify] Failed to send status-change email:', _err)
      }
    })()
  }

  // Write audit log for non-status field changes (asset tag, location, etc.)
  if (typeof updates.status !== 'string') {
    const changedFields = Object.keys(updates)
    if (changedFields.length > 0) {
      void (async () => {
        try {
          await admin.from('po_audit_log').insert(
            changedFields.map(field => ({
              po_id:           params.id,
              field_changed:   field,
              old_value:       String(current[field] ?? ''),
              new_value:       String(updates[field] ?? ''),
              changed_by:      user.id,
              changed_by_name: user.email ?? 'unknown',
              note:            typeof note === 'string' ? note : null,
            }))
          )
        } catch (_err) {
          console.error('[audit_log] Failed to write field-change audit entries:', _err)
        }
      })()
    }
  }

  return NextResponse.json(updated)
}

// ============================================================
// DELETE /api/pos/[id] — hard delete (IT Admin only)
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only IT admins may delete
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'it_admin') {
    return NextResponse.json({ error: 'Only IT Admins can delete POs' }, { status: 403 })
  }

  // Fetch PO for audit record before deletion
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id, po_number, department_name, status, documents:po_documents(storage_path)')
    .eq('id', params.id)
    .single()

  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

  // Only IT admins can delete a Closed PO (non-closed POs are deletable by any IT admin)
  // This guard is already satisfied by the role check above, but be explicit:
  // Closed POs should never be deleted outside of a compliance workflow — log the attempt.
  if (po.status === 'Closed') {
    console.warn(
      `[security] IT admin ${user.email} deleted a CLOSED PO: ${po.po_number}`
    )
  }

  // Delete storage documents first (clean up Supabase Storage)
  const docs = po.documents as Array<{ storage_path: string }> | null
  if (docs && docs.length > 0) {
    const paths = docs.map(d => d.storage_path).filter(Boolean)
    if (paths.length > 0) {
      // Non-fatal — if storage cleanup fails, continue with DB delete
      try {
        await admin.storage.from('po-documents').remove(paths)
      } catch (_err) {
        console.error('[storage] Failed to delete documents for PO', po.po_number, _err)
      }
    }
  }

  // Delete the PO (cascade deletes po_documents, po_audit_log via FK ON DELETE CASCADE)
  const { error: deleteError } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  // Write deletion to notification_log using await + try/catch (NOT .catch() on builder)
  void (async () => {
    try {
      await admin.from('notification_log').insert({
        po_id:      null,           // PO no longer exists
        event:      'po_created',   // closest event type available; treat as system event
        recipients: [user.email ?? ''],
        subject:    `[DELETED] PO ${po.po_number} (${po.department_name}) deleted by ${user.email}`,
      })
    } catch (_err) {
      // Non-fatal — deletion already succeeded
      console.error('[notification_log] Failed to log PO deletion:', _err)
    }
  })()

  return NextResponse.json({ deleted: true, po_number: po.po_number })
}

// ============================================================
// Helper: resolve notification recipients for a dept + event
// ============================================================
async function getNotificationRecipients(
  supabase: ReturnType<typeof createClient>,
  departmentId: string | null,
  event: string
): Promise<string[]> {
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
