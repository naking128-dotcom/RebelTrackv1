'use client'
import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import type { PurchaseOrder, Department, UserProfile } from '@/types'
import { MONTHS_SHORT, DEPT_COLORS } from '@/types'
import PageShell from '@/components/layout/PageShell'
import PODetailModal from '@/components/modals/PODetailModal'
import NewPOModal from '@/components/modals/NewPOModal'
import EmptyState from '@/components/ui/EmptyState'
import {
  AlertTriangle,
  CircleDollarSign,
  PackageCheck,
  ShieldAlert,
  Tags,
  Briefcase,
  Wrench,
  Building2,
} from 'lucide-react'

Chart.register(...registerables)

interface Props {
  pos: PurchaseOrder[]
  departments: Department[]
  profile: UserProfile
}

export default function DashboardClient({ pos, departments, profile }: Props) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showNewPO, setShowNewPO] = useState(false)
  const spendRef = useRef<HTMLCanvasElement>(null)
  const deptRef = useRef<HTMLCanvasElement>(null)
  const charts = useRef<Chart[]>([])

  const activePOs = pos.filter((p) => p.status !== 'Closed')
  const needsTag = pos.filter((p) => p.status === 'Received')
  const closed = pos.filter((p) => p.status === 'Closed')
  const ytdSpend = pos
    .filter((p) => new Date(p.created_at).getFullYear() === new Date().getFullYear())
    .reduce((a, p) => a + p.total_cost, 0)
  const now = new Date()
  const warrantyAlerts = pos.filter((p) => {
    if (!p.has_warranty || !p.warranty_end_date) return false
    const days = Math.round((new Date(p.warranty_end_date).getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 90
  })

  useEffect(() => {
    charts.current.forEach((c) => c.destroy())
    charts.current = []
    buildCharts()
    return () => charts.current.forEach((c) => c.destroy())
  }, [pos])

  function buildCharts() {
    const year = new Date().getFullYear()
    const monthlySpend = Array(12).fill(0)
    pos
      .filter((p) => new Date(p.created_at).getFullYear() === year)
      .forEach((p) => {
        const m = new Date(p.created_at).getMonth()
        monthlySpend[m] += p.total_cost
      })

    if (spendRef.current) {
      const c = new Chart(spendRef.current, {
        type: 'bar',
        data: {
          labels: MONTHS_SHORT,
          datasets: [
            {
              label: 'Spend',
              data: monthlySpend,
              backgroundColor: '#CE1126',
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 26,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: {
                callback: (v: number | string) => '$' + Math.round(Number(v) / 1000) + 'k',
                font: { size: 11 },
              },
              grid: { color: '#edf2f7' },
              border: { display: false },
            },
            x: { grid: { display: false }, ticks: { font: { size: 11 } }, border: { display: false } },
          },
        },
      })
      charts.current.push(c)
    }

    if (deptRef.current) {
      const deptSpend: Record<string, number> = {}
      pos.forEach((p) => {
        deptSpend[p.department_name] = (deptSpend[p.department_name] || 0) + p.total_cost
      })
      const keys = Object.keys(deptSpend)
      const colors = keys.map((k) => DEPT_COLORS[k] || '#888780')
      const c = new Chart(deptRef.current, {
        type: 'doughnut',
        data: {
          labels: keys,
          datasets: [{ data: keys.map((k) => deptSpend[k]), backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '72%',
        },
      })
      charts.current.push(c)
    }
  }

  const currentDepartmentName =
    profile.department?.name || (profile.role === 'business_office' ? 'Business Office' : 'Ole Miss Athletics')

  const metricCards = [
    { label: 'Active POs', value: activePOs.length, sub: 'Currently in progress', icon: PackageCheck },
    { label: 'Needs Asset Tag', value: needsTag.length, sub: 'Ready for tagging', icon: Tags },
    { label: 'Warranty Alerts', value: warrantyAlerts.length, sub: 'Within 90 days', icon: ShieldAlert },
    { label: 'YTD Spend', value: '$' + Math.round(ytdSpend / 1000) + 'k', sub: 'All departments', icon: CircleDollarSign },
    { label: 'Closed', value: closed.length, sub: 'Completed records', icon: AlertTriangle },
  ]

  const roleCards = {
    it_admin: {
      title: 'IT inventory focus',
      body: 'Track assets waiting for tags, verify serials, and maintain warranty readiness across departments.',
      icon: Wrench,
    },
    dept_admin: {
      title: 'Department operations focus',
      body: 'Monitor open orders, receiving needs, and department purchases with fast access to PO records.',
      icon: Briefcase,
    },
    business_office: {
      title: 'Business office focus',
      body: 'Watch spend, receiving checkpoints, and audit-ready order records without changing core approvals.',
      icon: Building2,
    },
    read_only: {
      title: 'Read-only overview',
      body: 'Review purchase activity, inventory status, and reporting snapshots without editing records.',
      icon: Building2,
    },
  } as const

  const focusCard = roleCards[profile.role]
  const FocusIcon = focusCard.icon
  const recentPOs = pos.slice(0, 5)

  return (
    <PageShell
      title="Operations Dashboard"
      subtitle="Monitor purchase order activity, warranty alerts, and department spend across Ole Miss Athletics without changing the underlying workflow."
      departmentName={currentDepartmentName}
      eyebrow="Ole Miss Athletics"
      statChips={[
        { label: 'Active POs', value: activePOs.length },
        { label: 'Needs Tag', value: needsTag.length },
        { label: 'YTD Spend', value: '$' + Math.round(ytdSpend / 1000) + 'k' },
      ]}
      actions={
        <>
          <button className="btn btn-subtle" onClick={() => window.location.assign('/purchase-orders')}>
            View queue
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewPO(true)}>
            + New PO
          </button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="role-panel">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Role-aware workspace</div>
            <h2 className="mt-2 font-display text-2xl tracking-[-0.02em] text-slate-900">{focusCard.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{focusCard.body}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <FocusIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.02em] text-slate-900">At a glance</h2>
              <p className="mt-1 text-sm text-slate-500">Fast context for today’s work</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Departments</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{departments.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Recent records</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{recentPOs.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{s.label}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900">{s.value}</div>
                  <div className="mt-2 text-sm text-slate-500">{s.sub}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="panel p-5 md:p-6">
          <h2 className="font-display text-2xl tracking-[-0.02em] text-slate-900">Monthly spend</h2>
          <p className="mt-1 text-sm text-slate-500">{new Date().getFullYear()} purchasing activity by month</p>
          <div className="mt-5 relative" style={{ height: 240 }}>
            <canvas ref={spendRef} role="img" aria-label="Monthly spend bar chart" />
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <h2 className="font-display text-2xl tracking-[-0.02em] text-slate-900">Department mix</h2>
          <p className="mt-1 text-sm text-slate-500">Current spend distribution across athletics units</p>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="relative mx-auto h-[180px] w-[180px] lg:mx-0">
              <canvas ref={deptRef} role="img" aria-label="Department spend doughnut chart" />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 text-sm">
              {Object.entries(DEPT_COLORS).map(([dept, color]) => {
                const spend = pos.filter((p) => p.department_name === dept).reduce((a, p) => a + p.total_cost, 0)
                if (!spend) return null
                return (
                  <div key={dept} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="font-medium">{dept}</span>
                    </div>
                    <span className="text-slate-500">${Math.round(spend / 1000)}k</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel">
          <div className="panel-header justify-between">
            <div>
              <div className="font-display text-xl tracking-[-0.02em] text-slate-900">Warranty alerts</div>
              <div className="mt-1 text-sm text-slate-500">Assets with warranty coverage nearing expiration</div>
            </div>
            <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              {warrantyAlerts.length} pending
            </div>
          </div>
          <div className="p-5 md:p-6">
            {warrantyAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>PO #</th><th>Item</th><th>Department</th><th>Expires</th><th>Days Left</th></tr></thead>
                  <tbody>
                    {warrantyAlerts.map((p) => {
                      const days = Math.round((new Date(p.warranty_end_date!).getTime() - Date.now()) / 86400000)
                      return (
                        <tr key={p.id} className="cursor-pointer" onClick={() => setSelectedPO(p)}>
                          <td className="font-semibold text-slate-900">{p.po_number}</td>
                          <td>{p.item_description}</td>
                          <td>{p.department_name}</td>
                          <td>{p.warranty_end_date}</td>
                          <td>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${days < 30 ? 'bg-red-50 text-red-700' : days < 60 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {days}d
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No warranty issues right now"
                description="This section will surface expiring coverage automatically. Right now, no tracked assets are within the 90-day alert window."
                icon={<ShieldAlert className="h-5 w-5" />}
              />
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header justify-between">
            <div>
              <div className="font-display text-xl tracking-[-0.02em] text-slate-900">Recent purchase orders</div>
              <div className="mt-1 text-sm text-slate-500">Quick entry points into the latest activity</div>
            </div>
          </div>
          <div className="p-4 md:p-5">
            {recentPOs.length > 0 ? (
              <div className="space-y-3">
                {recentPOs.map((po) => (
                  <button
                    key={po.id}
                    className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                    onClick={() => setSelectedPO(po)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{po.po_number}</span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate text-sm text-slate-500">{po.vendor_name}</span>
                        </div>
                        <div className="mt-1 truncate text-sm text-slate-600">{po.item_description}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{po.department_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">${po.total_cost.toLocaleString()}</div>
                        <div className="mt-2"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{po.status}</span></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No purchase orders yet"
                description="Once orders are created, they will appear here for faster review and follow-up."
                action={<button className="btn btn-primary" onClick={() => setShowNewPO(true)}>Create first PO</button>}
              />
            )}
          </div>
        </div>
      </div>

      {selectedPO && <PODetailModal po={selectedPO} onClose={() => setSelectedPO(null)} onUpdated={() => window.location.reload()} />}
      {showNewPO && <NewPOModal departments={departments} onClose={() => setShowNewPO(false)} onSaved={() => window.location.reload()} />}
    </PageShell>
  )
}
