import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { generateCSV, generateInventoryCSV, generateWarrantyCSV } from '@/lib/export'
import type { PurchaseOrder } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  // ── Auth gate ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, department_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // read_only users cannot export anything
  if (profile.role === 'read_only') {
    return NextResponse.json({ error: 'Forbidden — read-only users cannot export data' }, { status: 403 })
  }
  // ─────────────────────────────────────────────────────────

  const type   = searchParams.get('type') || 'all'
  const dept   = searchParams.get('department_id')
  const year   = searchParams.get('year')
  const month  = searchParams.get('month')
  const status = searchParams.get('status')

  let query = supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(vendor_id)')
    .order('created_at', { ascending: false })

  // dept_admin is always scoped to their own department
  const effectiveDept = profile.role === 'dept_admin'
    ? profile.department_id
    : dept

  if (effectiveDept) query = query.eq('department_id', effectiveDept)
  if (status) query = query.eq('status', status)
  if (year)   query = query.gte('created_at', `${year}-01-01`).lte('created_at', `${year}-12-31`)
  if (month && year) {
    const m = month.padStart(2, '0')
    query = query
      .gte('created_at', `${year}-${m}-01`)
      .lte('created_at', `${year}-${m}-31`)
  }
  if (type === 'warranty') query = query.eq('has_warranty', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const pos = data as PurchaseOrder[]

  let csv: string
  let filename: string

  switch (type) {
    case 'inventory':
      csv = generateInventoryCSV(pos)
      filename = 'RebelTrack_Inventory.csv'
      break
    case 'warranty':
      csv = generateWarrantyCSV(pos)
      filename = 'RebelTrack_Warranties.csv'
      break
    default:
      csv = generateCSV(pos)
      filename = `RebelTrack_POs_${new Date().toISOString().slice(0,10)}.csv`
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
