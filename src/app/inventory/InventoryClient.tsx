'use client'
import { useState, useMemo } from 'react'
import type { PurchaseOrder, Department, UserProfile } from '@/types'
import PageShell from '@/components/layout/PageShell'
import PODetailModal from '@/components/modals/PODetailModal'
import EmptyState from '@/components/ui/EmptyState'
import { Package } from 'lucide-react'

interface Props {
  pos: PurchaseOrder[]
  departments: Department[]
  profile: UserProfile
}

export default function InventoryClient({ pos, departments, profile }: Props) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [deptFilter, setDeptFilter] = useState('')
  const [tagFilter, setTagFilter]   = useState('all')
  const [search, setSearch]         = useState('')

  const filtered = useMemo(() => {
    return pos.filter(p => {
      if (deptFilter && p.department_name !== deptFilter) return false
      if (tagFilter === 'tagged'   && !p.asset_tag) return false
      if (tagFilter === 'untagged' && p.asset_tag)  return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.po_number.toLowerCase().includes(q) ||
          p.item_description.toLowerCase().includes(q) ||
          (p.asset_tag?.toLowerCase().includes(q) ?? false) ||
          (p.building?.toLowerCase().includes(q) ?? false) ||
          (p.custodian?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [pos, deptFilter, tagFilter, search])

  const tagged   = pos.filter(p => p.asset_tag).length
  const untagged = pos.length - tagged
  const deptNames = [...new Set(pos.map(p => p.department_name))].sort()

  return (
    <PageShell title="Inventory" className="flex-1 overflow-y-auto">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3">
        {[
          { label: 'Total Items',  val: pos.length,  color: '#CE1126' },
          { label: 'Asset Tagged', val: tagged,       color: '#166534' },
          { label: 'Untagged',     val: untagged,     color: '#b45309' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl mb-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <input
            type="text"
            placeholder="Search PO #, item, tag, building..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input flex-1 min-w-[160px] text-sm"
          />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="form-input text-sm">
            <option value="">All Departments</option>
            {deptNames.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="form-input text-sm">
            <option value="all">All Items</option>
            <option value="tagged">Tagged</option>
            <option value="untagged">Untagged</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {pos.length}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No items match" description="Adjust your filters to see inventory items." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {['PO #', 'Item', 'Asset Tag', 'Dept', 'Building / Room', 'Custodian', 'Warranty'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPO(p)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{p.po_number}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{p.item_description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.asset_tag
                        ? <span className="font-mono text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg">{p.asset_tag}</span>
                        : <span className="text-xs font-bold text-red-500">Untagged</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{p.department_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{[p.building, p.room].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.custodian || '—'}</td>
                    <td className="px-4 py-3">
                      {p.has_warranty
                        ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-semibold">Yes</span>
                        : <span className="text-xs text-slate-300">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPO && (
        <PODetailModal
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onUpdated={() => setSelectedPO(null)}
        />
      )}
    </PageShell>
  )
}
