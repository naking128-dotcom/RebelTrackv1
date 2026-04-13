'use client'
import React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { UserProfile, Department, UserRole } from '@/types'
import { USER_ROLES } from '@/types'
import PageShell from '@/components/layout/PageShell'
import EmptyState from '@/components/ui/EmptyState'
import { Building2, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react'

interface Props {
  users: UserProfile[]
  departments: Department[]
}

const ROLE_STYLES: Record<UserRole, string> = {
  it_admin: 'bg-red-50 text-red-700 border-red-100',
  dept_admin: 'bg-green-50 text-green-700 border-green-100',
  business_office: 'bg-blue-50 text-blue-700 border-blue-100',
  read_only: 'bg-slate-100 text-slate-600 border-slate-200',
}
const ROLE_LABELS: Record<UserRole, string> = {
  it_admin: 'IT Admin',
  dept_admin: 'Dept Admin',
  business_office: 'Business Office',
  read_only: 'Read Only',
}
const AVATAR_COLORS = ['#CE1126', '#3B6D11', '#14213D', '#854F0B', '#534AB7', '#888780']

export default function UsersClient({ users, departments }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')

  const filtered = users.filter((u) => {
    const hit = !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const roleHit = !roleFilter || u.role === roleFilter
    return hit && roleHit
  })

  const counts = useMemo(() => ({
    active: users.filter((u) => u.is_active).length,
    disabled: users.filter((u) => !u.is_active).length,
    it: users.filter((u) => u.role === 'it_admin').length,
    dept: users.filter((u) => u.role === 'dept_admin').length,
  }), [users])

  return (
    <PageShell
      title="User Access & Roles"
      subtitle="Manage athletics staff access, role assignments, and department ownership without changing the procurement workflow underneath the app."
      departmentName="Ole Miss Athletics"
      eyebrow="Administration"
      statChips={[
        { label: 'Users', value: users.length },
        { label: 'Active', value: counts.active },
        { label: 'Disabled', value: counts.disabled },
      ]}
      actions={<button className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }}><UserPlus className="h-4 w-4" />Add User</button>}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="role-panel">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Role refinement</div>
            <h2 className="mt-2 font-display text-2xl tracking-[-0.02em] text-slate-900">Keep the right people in the right workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Department admins, business office staff, and IT inventory managers can share the same product while seeing cleaner access boundaries and ownership context.
            </p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <UserCog className="h-6 w-6" />
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">At a glance</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniMetric label="IT admins" value={counts.it} icon={ShieldCheck} />
            <MiniMetric label="Dept admins" value={counts.dept} icon={Building2} />
            <MiniMetric label="Departments" value={departments.length} icon={Users} />
            <MiniMetric label="Search results" value={filtered.length} icon={UserCog} />
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">System Users ({users.length})</div>
            <div className="text-xs text-slate-500">Search, filter, and edit user access</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="form-input !w-56 !py-2 text-sm"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-input !w-auto !py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}>
              <option value="">All roles</option>
              {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {(search || roleFilter) ? <button className="btn" onClick={() => { setSearch(''); setRoleFilter('') }}>Reset</button> : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No users match the current filters"
              description="Clear the search or switch the role filter to bring user accounts back into view."
              action={<button className="btn btn-primary" onClick={() => { setSearch(''); setRoleFilter('') }}>Reset filters</button>}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((u, i) => {
              const initials = `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
              return (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold" style={{ background: color + '1c', color }}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${ROLE_STYLES[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {u.department?.name || 'All departments'}
                  </span>
                  {!u.is_active ? <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600">Disabled</span> : null}
                  <button className="btn btn-sm ml-auto" onClick={() => { setEditUser(u); setShowModal(true) }}>Edit</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          departments={departments}
          user={editUser}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); window.location.reload() }}
        />
      )}
    </PageShell>
  )
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-900">{value}</div>
    </div>
  )
}

function UserModal({
  departments,
  user,
  onClose,
  onSaved,
}: {
  departments: Department[]
  user: UserProfile | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: (user?.role || 'read_only') as UserRole,
    department_id: user?.department_id || '',
    password: '',
    force_reset: true,
    is_active: user?.is_active ?? true,
    notify_po_created: true,
    notify_status_changes: true,
    notify_warranty: true,
    notify_all_dept: false,
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !form.password) {
      toast.error('Password required for new users')
      return
    }
    setLoading(true)

    const res = await fetch('/api/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: user!.id, ...form } : form),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Failed to save user')
      setLoading(false)
      return
    }

    toast.success(isEdit ? 'User updated' : 'User created — welcome email sent')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="modal-shell w-full max-w-2xl overflow-hidden">
        <div className="modal-header">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">User Access</div>
            <h2 className="mt-2 font-display text-3xl tracking-[-0.03em] text-slate-900">{isEdit ? 'Edit User' : 'Add New User'}</h2>
            <p className="mt-1 text-sm text-slate-500">Assign a role, department scope, and notification defaults.</p>
          </div>
          <button className="btn btn-ghost h-10 w-10 justify-center rounded-2xl p-0" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="form-label">First Name <span className="text-red-500">*</span></label>
                <input className="form-input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Last Name <span className="text-red-500">*</span></label>
                <input className="form-input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Email <span className="text-red-500">*</span></label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required disabled={isEdit} />
              </div>
              <div>
                <label className="form-label">Role <span className="text-red-500">*</span></label>
                <select className="form-input" value={form.role} onChange={(e) => set('role', e.target.value)} required>
                  {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-input" value={form.department_id} onChange={(e) => set('department_id', e.target.value)}>
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">{isEdit ? 'Reset Password (leave blank to keep)' : 'Temporary Password'} {!isEdit && <span className="text-red-500">*</span>}</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={isEdit ? 'Leave blank to keep current' : 'Set initial password'} />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Access controls</div>
              <div className="mt-3 space-y-2">
                {!isEdit ? (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" className="accent-red-600" checked={form.force_reset} onChange={(e) => set('force_reset', e.target.checked)} />
                    Force password reset on first login
                  </label>
                ) : (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" className="accent-red-600" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                    Account active
                  </label>
                )}
              </div>
            </div>

            {!isEdit && (
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Notification defaults</div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[
                    { key: 'notify_po_created', label: 'PO Created' },
                    { key: 'notify_status_changes', label: 'Status changes' },
                    { key: 'notify_warranty', label: 'Warranty alerts' },
                    { key: 'notify_all_dept', label: 'All POs in assigned department' },
                  ].map((n) => (
                    <label key={n.key} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" className="accent-red-600" checked={(form as Record<string, unknown>)[n.key] as boolean} onChange={(e) => set(n.key, e.target.checked)} />
                      {n.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Send Welcome Email'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
