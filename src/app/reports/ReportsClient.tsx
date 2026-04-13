'use client'
import { useState, useMemo } from 'react'
import type { PurchaseOrder, Department, UserProfile, POStatus } from '@/types'
import { MONTHS_SHORT } from '@/types'
import PageShell from '@/components/layout/PageShell'
import { downloadCSV } from '@/lib/export'
import { FileDown } from 'lucide-react'

interface Props { pos: PurchaseOrder[]; departments: Department[]; profile: UserProfile }

const REPORT_CARDS: { id: string; title: string; desc: string; filter: (p: PurchaseOrder) => boolean; filename: string }[] = [
  { id: 'all',      title: 'All Purchase Orders', desc: 'Full PO list — all fields, all departments.', filter: (_: PurchaseOrder) => true,                    filename: 'RebelTrack_POs.csv' },
  { id: 'active',   title: 'Active POs',           desc: 'All POs not yet closed.',                    filter: (p: PurchaseOrder) => p.status !== 'Closed',   filename: 'RebelTrack_Active.csv' },
  { id: 'inventory',title: 'Inventory Master',     desc: 'Assets with tags, buildings, custodians.',   filter: (_: PurchaseOrder) => true,                    filename: 'RebelTrack_Inventory.csv' },
  { id: 'warranty', title: 'Warranty Register',    desc: 'Active warranties with expiry dates.',       filter: (p: PurchaseOrder) => p.has_warranty,          filename: 'RebelTrack_Warranties.csv' },
  { id: 'needstag', title: 'Needs Asset Tag',      desc: 'Items in Received status awaiting tag.',     filter: (p: PurchaseOrder) => p.status === 'Received', filename: 'RebelTrack_NeedsTag.csv' },
  { id: 'closed',   title: 'Closed POs Archive',   desc: 'Complete archive of closed records.',        filter: (p: PurchaseOrder) => p.status === 'Closed',   filename: 'RebelTrack_Closed.csv' },
]

export default function ReportsClient({ pos, departments, profile }: Props) {
  const [deptFilter, setDeptFilter]   = useState('')
  const [yearFilter, setYearFilter]   = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const years = [...new Set(pos.map(p => new Date(p.created_at).getFullYear()))].sort((a, b) => b - a)
  const deptNames = [...new Set(pos.map(p => p.department_name))].sort()

  const filteredPos = useMemo(() => {
    return pos.filter(p => {
      if (deptFilter   && p.department_name !== deptFilter) return false
      if (statusFilter && p.status !== statusFilter as POStatus) return false
      if (yearFilter) {
        if (new Date(p.created_at).getFullYear() !== parseInt(yearFilter)) return false
      }
      if (monthFilter) {
        if (new Date(p.created_at).getMonth() !== parseInt(monthFilter)) return false
      }
      return true
    })
  }, [pos, deptFilter, yearFilter, monthFilter, statusFilter])

  const ytd = pos.filter(p => new Date(p.created_at).getFullYear() === new Date().getFullYear()).reduce((a, p) => a + p.total_cost, 0)

  function handleQuickExport() {
    const fn = deptFilter ? `RebelTrack_${deptFilter.replace(/\s+/g, '_')}.csv` : 'RebelTrack_Filtered.csv'
    downloadCSV(filteredPos, fn)
  }

  return (
    <PageShell title="Reports" className="flex-1 overflow-y-auto">

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        {[
          { label: 'YTD Spend',  val: `$${Math.round(ytd / 1000)}k`,                   color: '#CE1126' },
          { label: 'Total POs',  val: pos.length,                                        color: '#0C447C' },
          { label: 'Closed',     val: pos.filter(p => p.status === 'Closed').length,     color: '#444441' },
          { label: 'Warranties', val: pos.filter(p => p.has_warranty).length,            color: '#3B6D11' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Quick filtered export */}
      <div className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-800">Quick filtered export</div>
        <div className="flex flex-wrap gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100 items-end">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Department</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="form-input text-sm">
              <option value="">All</option>
              {deptNames.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Year</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="form-input text-sm">
              <option value="">All</option>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Month</label>
            <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="form-input text-sm">
              <option value="">All</option>
              {MONTHS_SHORT.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input text-sm">
              <option value="">All</option>
              {['PO Created','Ordered','Shipped','Delivered','Received','Asset Tagged','Closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={handleQuickExport} className="btn btn-primary flex items-center gap-2 self-end">
            <FileDown className="w-4 h-4" />
            Export CSV ({filteredPos.length})
          </button>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_CARDS.map(card => {
          const rows = pos.filter(card.filter)
          return (
            <div key={card.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-red-200 hover:shadow-sm transition-all">
              <div className="text-3xl font-black text-red-600 mb-1">{rows.length}</div>
              <div className="font-bold text-slate-800 mb-1">{card.title}</div>
              <div className="text-xs text-slate-400 mb-4">{card.desc}</div>
              <button
                onClick={() => downloadCSV(rows, card.filename)}
                className="btn btn-primary w-full justify-center text-sm"
              >
                <FileDown className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
