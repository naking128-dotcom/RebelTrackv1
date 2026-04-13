'use client'
import { useMemo, useState } from 'react'
import type { PurchaseOrder, Department } from '@/types'
import { MONTHS_SHORT } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import PODetailModal from '@/components/modals/PODetailModal'
import NewPOModal from '@/components/modals/NewPOModal'
import { downloadCSV } from '@/lib/export'
import PageShell from '@/components/layout/PageShell'
import EmptyState from '@/components/ui/EmptyState'
import { Filter, SearchX } from 'lucide-react'

interface Props {
  pos: PurchaseOrder[]
  departments: Department[]
}

const TABS: { key: string; label: string; filter: (p: PurchaseOrder) => boolean }[] = [
  { key: 'all', label: 'All POs', filter: () => true },
  { key: 'active', label: 'Active', filter: (p) => p.status !== 'Closed' },
  { key: 'awaiting', label: 'Awaiting Receipt', filter: (p) => p.status === 'Delivered' },
  { key: 'tag', label: 'Needs Tag', filter: (p) => p.status === 'Received' },
  { key: 'closed', label: 'Closed', filter: (p) => p.status === 'Closed' },
]

export default function POsClient({ pos, departments }: Props) {
  const [tab, setTab] = useState('all')
  const [deptFilter, setDeptFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showNewPO, setShowNewPO] = useState(false)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const years = [...new Set(pos.map((p) => new Date(p.created_at).getFullYear()))].sort((a, b) => b - a)

  const filtered = useMemo(() => {
    const tabFilter = TABS.find((t) => t.key === tab)?.filter || (() => true)
    return pos
      .filter(tabFilter)
      .filter((p) => !deptFilter || p.department_name === deptFilter)
      .filter((p) => !yearFilter || new Date(p.created_at).getFullYear() === parseInt(yearFilter))
      .filter((p) => !monthFilter || new Date(p.created_at).getMonth() === parseInt(monthFilter))
      .filter((p) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.po_number.toLowerCase().includes(q) ||
          p.vendor_name.toLowerCase().includes(q) ||
          p.item_description.toLowerCase().includes(q) ||
          p.department_name.toLowerCase().includes(q) ||
          p.requester_name.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortField] ?? ''
        const bv = (b as Record<string, unknown>)[sortField] ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [pos, tab, deptFilter, yearFilter, monthFilter, search, sortField, sortDir])

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <span className="ml-1 text-slate-300">↕</span>
    return <span className="ml-1 text-red-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const activeCount = pos.filter((p) => p.status !== 'Closed').length
  const awaitingCount = pos.filter((p) => p.status === 'Delivered').length
  const tagCount = pos.filter((p) => p.status === 'Received').length
  const hasFilters = Boolean(deptFilter || yearFilter || monthFilter || search)

  function clearFilters() {
    setDeptFilter('')
    setYearFilter('')
    setMonthFilter('')
    setSearch('')
  }

  return (
    <PageShell
      title="Purchase Orders"
      subtitle="Search, filter, review, and export purchase orders without changing any of the approved business logic."
      departmentName="Ole Miss Athletics"
      eyebrow="Operations Queue"
      statChips={[
        { label: 'All Records', value: pos.length },
        { label: 'Active', value: activeCount },
        { label: 'Awaiting Receipt', value: awaitingCount },
        { label: 'Needs Tag', value: tagCount },
      ]}
      actions={<button className="btn btn-primary" onClick={() => setShowNewPO(true)}>+ New PO</button>}
    >
      <div className="glass-strip mb-5 p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                className={`filter-pill ${active ? 'border-red-200 bg-red-50 text-red-700 shadow-sm' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700'}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                <span className="ml-1.5 text-slate-400">({pos.filter(t.filter).length})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="topbar-chip"><Filter className="h-3.5 w-3.5" /> View: {TABS.find((t) => t.key === tab)?.label}</span>
        {deptFilter ? <span className="topbar-chip topbar-chip-muted">Dept: {deptFilter}</span> : null}
        {yearFilter ? <span className="topbar-chip topbar-chip-muted">Year: {yearFilter}</span> : null}
        {monthFilter ? <span className="topbar-chip topbar-chip-muted">Month: {MONTHS_SHORT[parseInt(monthFilter)]}</span> : null}
        {search ? <span className="topbar-chip topbar-chip-muted">Search: {search}</span> : null}
      </div>

      <div className="panel">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 md:px-6">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_repeat(3,180px)_auto_auto] xl:items-center">
            <input
              className="form-input"
              placeholder="Search PO, vendor, item, requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-input" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select className="form-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="form-input" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="">All Months</option>
              {MONTHS_SHORT.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            {hasFilters ? (
              <button className="btn btn-ghost text-red-600" onClick={clearFilters}>Clear filters</button>
            ) : <div />}
            <button className="btn btn-primary" onClick={() => downloadCSV(filtered, `RebelTrack_${deptFilter || 'All'}.csv`)}>
              Export CSV ({filtered.length})
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('po_number')}>PO # <SortIcon field="po_number" /></th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('vendor_name')}>Vendor <SortIcon field="vendor_name" /></th>
                    <th>Item</th>
                    <th className="hide-mobile cursor-pointer select-none" onClick={() => handleSort('department_name')}>Dept <SortIcon field="department_name" /></th>
                    <th className="hide-mobile cursor-pointer select-none" onClick={() => handleSort('total_cost')}>Total <SortIcon field="total_cost" /></th>
                    <th className="hide-mobile cursor-pointer select-none" onClick={() => handleSort('order_date')}>Order Date <SortIcon field="order_date" /></th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('status')}>Status <SortIcon field="status" /></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setSelectedPO(p)}>
                      <td className="font-semibold text-slate-900">{p.po_number}</td>
                      <td>{p.vendor_name}</td>
                      <td className="max-w-xs truncate text-slate-700">{p.item_description}</td>
                      <td className="hide-mobile text-xs text-slate-500">{p.department_name}</td>
                      <td className="hide-mobile font-medium">${p.total_cost.toLocaleString()}</td>
                      <td className="hide-mobile text-xs text-slate-500">{p.order_date || '—'}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <button className="text-xs font-semibold text-red-600 no-underline hover:underline" onClick={(e) => { e.stopPropagation(); setSelectedPO(p) }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 md:px-6">
              <span>Showing {filtered.length} of {pos.length} records</span>
              <span>Sorted by {sortField.replace('_', ' ')} ({sortDir})</span>
            </div>
          </>
        ) : (
          <div className="p-6 md:p-8">
            <EmptyState
              title="No purchase orders match this view"
              description="Adjust your filters, try a broader search, or create a new purchase order to begin tracking inventory and lifecycle updates."
              icon={<SearchX className="h-5 w-5" />}
              action={
                <div className="flex flex-wrap gap-2">
                  {hasFilters ? <button className="btn" onClick={clearFilters}>Reset filters</button> : null}
                  <button className="btn btn-primary" onClick={() => setShowNewPO(true)}>Create PO</button>
                </div>
              }
            />
          </div>
        )}
      </div>

      {selectedPO && (
        <PODetailModal
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onUpdated={() => {
            setSelectedPO(null)
            window.location.reload()
          }}
        />
      )}
      {showNewPO && (
        <NewPOModal
          departments={departments}
          onClose={() => setShowNewPO(false)}
          onSaved={() => { setShowNewPO(false); window.location.reload() }}
        />
      )}
    </PageShell>
  )
}
