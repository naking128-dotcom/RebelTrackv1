'use client'
import { useState, useMemo } from 'react'
import type { PurchaseOrder, UserProfile } from '@/types'
import PageShell from '@/components/layout/PageShell'
import PODetailModal from '@/components/modals/PODetailModal'
import EmptyState from '@/components/ui/EmptyState'
import { ShieldCheck } from 'lucide-react'

interface Props { pos: PurchaseOrder[]; profile?: UserProfile }

function daysLeft(dateStr: string) {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0)   return <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">Expired</span>
  if (days <= 30)  return <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200">{days}d</span>
  if (days <= 90)  return <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">{days}d</span>
  return <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200">{days}d</span>
}

export default function WarrantiesClient({ pos, profile }: Props) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [filter, setFilter]         = useState('all')

  const warranties = useMemo(() =>
    pos.filter(p => p.has_warranty && p.warranty_end_date)
       .sort((a, b) => new Date(a.warranty_end_date!).getTime() - new Date(b.warranty_end_date!).getTime()),
  [pos])

  const filtered = useMemo(() => {
    if (filter === 'expiring90')  return warranties.filter(p => { const d = daysLeft(p.warranty_end_date!); return d >= 0 && d <= 90 })
    if (filter === 'expiring365') return warranties.filter(p => { const d = daysLeft(p.warranty_end_date!); return d > 90 && d <= 365 })
    if (filter === 'expired')     return warranties.filter(p => daysLeft(p.warranty_end_date!) < 0)
    return warranties
  }, [warranties, filter])

  const exp90  = warranties.filter(p => { const d = daysLeft(p.warranty_end_date!); return d >= 0 && d <= 90 }).length
  const exp365 = warranties.filter(p => { const d = daysLeft(p.warranty_end_date!); return d > 90 && d <= 365 }).length
  const expired = warranties.filter(p => daysLeft(p.warranty_end_date!) < 0).length

  return (
    <PageShell title="Warranties" className="flex-1 overflow-y-auto">

      {exp90 > 0 && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800 font-medium">
          ⚠ <strong>{exp90} warranty{exp90 !== 1 ? 'ies' : 'y'}</strong> expiring within 90 days.
          Quarterly digest emails send automatically Jan 1 · Apr 1 · Jul 1 · Oct 1 at 8 AM CT.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        {[
          { label: 'Active', val: warranties.length, color: '#CE1126', key: 'all' },
          { label: 'Expiring 90d', val: exp90, color: '#b45309', key: 'expiring90' },
          { label: 'Expiring 1yr', val: exp365, color: '#1d4ed8', key: 'expiring365' },
          { label: 'Expired', val: expired, color: '#64748b', key: 'expired' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`bg-white border rounded-2xl p-4 text-left transition-all ${filter === s.key ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No warranties match" description="Adjust the filter above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  {['PO #', 'Item', 'Department', 'Provider', 'End Date', 'Days Left'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPO(p)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{p.po_number}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{p.item_description}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.department_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.warranty_provider || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-xs whitespace-nowrap">{p.warranty_end_date}</td>
                    <td className="px-4 py-3"><DaysBadge days={daysLeft(p.warranty_end_date!)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPO && (
        <PODetailModal po={selectedPO} onClose={() => setSelectedPO(null)} onUpdated={() => setSelectedPO(null)} />
      )}
    </PageShell>
  )
}
