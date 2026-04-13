import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/departments — flat list or grouped tree
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const grouped  = new URL(request.url).searchParams.get('grouped')

  if (grouped) {
    const { data, error } = await supabase.rpc('get_dept_tree')
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/departments — create dept or sub-dept
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only IT admins can create departments
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'it_admin') {
    return NextResponse.json({ error: 'Only IT Admins can manage departments' }, { status: 403 })
  }

  const body = await request.json()
  const { name, parent_id, sport_group, gender, icon, color, sort_order } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('departments')
    .insert({ name, parent_id: parent_id || null, sport_group, gender, icon, color, sort_order: sort_order || 0 })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/departments — update name, head, sort order
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'it_admin') {
    return NextResponse.json({ error: 'Only IT Admins can manage departments' }, { status: 403 })
  }

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('departments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE /api/departments — soft delete (only if no POs assigned)
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Safety check — don't delete if POs are assigned
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} purchase order(s) are assigned to this department` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ deleted: true })
}
