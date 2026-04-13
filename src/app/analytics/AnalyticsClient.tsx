'use client'
import type { ReactNode } from 'react'
import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { MONTHS_SHORT, DEPT_COLORS, PO_STATUS_FLOW } from '@/types'
import type { PurchaseOrder, Department } from '@/types'
import { downloadCSV } from '@/lib/export'
import PageShell from '@/components/layout/PageShell'
import EmptyState from '@/components/ui/EmptyState'
import { BarChart3, Filter, Layers3, PieChart, Receipt, TrendingUp } from 'lucide-react'

Chart.register(...registerables)

interface Props {
  pos: PurchaseOrder[]
  departments: Department[]
}

export default function AnalyticsClient({ pos, departments }: Props) {
  const [deptFilter, setDeptFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()))
  const [monthFilter, setMonthFilter] = useState('')
  const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly')

  const spendRef = useRef<HTMLCanvasElement>(null)
  const statusRef = useRef<HTMLCanvasElement>(null)
  const catRef = useRef<HTMLCanvasElement>(null)
  const deptRef = useRef<HTMLCanvasElement>(null)
  const charts = useRef<Chart[]>([])

  const years = [...new Set(pos.map((p) => new Date(p.created_at).getFullYear()))].sort((a, b) => b - a)

  const filtered = pos.filter((p) => {
    const d = new Date(p.created_at)
    if (deptFilter && p.department_name !== deptFilter) return false
    if (yearFilter && d.getFullYear() !== parseInt(yearFilter)) return false
    if (monthFilter && d.getMonth() !== parseInt(monthFilter)) return false
    return true
  })

  useEffect(() => {
    charts.current.forEach((c) => c.destroy())
    charts.current = []
    buildCharts()
    return () => charts.current.forEach((c) => c.destroy())
  }, [filtered, periodMode])

  function buildCharts() {
    if (spendRef.current) {
      let labels: string[]
      let data: number[]
      if (periodMode === 'monthly') {
        const monthly = Array(12).fill(0)
        filtered.forEach((p) => {
          monthly[new Date(p.created_at).getMonth()] += p.total_cost
        })
        labels = MONTHS_SHORT
        data = monthly
      } else {
        const yearly: Record<number, number> = {}
        filtered.forEach((p) => {
          const y = new Date(p.created_at).getFullYear()
          yearly[y] = (yearly[y] || 0) + p.total_cost
        })
        labels = Object.keys(yearly).sort()
        data = labels.map((y) => yearly[parseInt(y)])
      }
      charts.current.push(
        new Chart(spendRef.current, {
          type: periodMode === 'monthly' ? 'line' : 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Spend',
                data,
                borderColor: '#CE1126',
                backgroundColor: periodMode === 'monthly' ? 'rgba(206,17,38,0.08)' : '#CE1126',
                fill: periodMode === 'monthly',
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#CE1126',
                borderRadius: 6,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                ticks: { callback: (v: number | string) => '$' + Math.round(Number(v) / 1000) + 'k', font: { size: 11 } },
                grid: { color: '#eef2f7' },
                border: { display: false },
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 0 },
                border: { display: false },
              },
            },
          },
        })
      )
    }

    if (statusRef.current) {
      const counts = PO_STATUS_FLOW.map((s) => filtered.filter((p) => p.status === s).length)
      const colors = ['#14213D', '#185FA5', '#854F0B', '#3B6D11', '#27500A', '#C8A96E', '#888780']
      charts.current.push(
        new Chart(statusRef.current, {
          type: 'bar',
          data: {
            labels: PO_STATUS_FLOW,
            datasets: [{ label: 'Count', data: counts, backgroundColor: colors, borderRadius: 6, borderSkipped: false }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#eef2f7' }, border: { display: false } },
              x: { grid: { display: false }, ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 28 }, border: { display: false } },
            },
          },
        })
      )
    }

    if (catRef.current) {
      const catSpend: Record<string, number> = {}
      filtered.forEach((p) => {
        catSpend[p.category || 'Other'] = (catSpend[p.category || 'Other'] || 0) + p.total_cost
      })
      const keys = Object.keys(catSpend)
      const cColors = ['#CE1126', '#185FA5', '#3B6D11', '#854F0B', '#534AB7', '#888780', '#C8A96E']
      charts.current.push(
        new Chart(catRef.current, {
          type: 'doughnut',
          data: { labels: keys, datasets: [{ data: keys.map((k) => catSpend[k]), backgroundColor: cColors, borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '68%' },
        })
      )
    }

    if (deptRef.current) {
      const deptSpend: Record<string, number> = {}
      filtered.forEach((p) => {
        deptSpend[p.department_name] = (deptSpend[p.department_name] || 0) + p.total_cost
      })
      const keys = Object.keys(deptSpend).sort((a, b) => deptSpend[b] - deptSpend[a])
      const colors = keys.map((k) => DEPT_COLORS[k] || '#888780')
      charts.current.push(
        new Chart(deptRef.current, {
          type: 'bar',
          data: { labels: keys, datasets: [{ label: 'Spend', data: keys.map((k) => deptSpend[k]), backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { callback: (v: number | string) => '$' + Math.round(Number(v) / 1000) + 'k', font: { size: 11 } }, grid: { color: '#eef2f7' }, border: { display: false } },
              x: { grid: { display: false }, ticks: { font: { size: 10 } }, border: { display: false } },
            },
          },
        })
      )
    }
  }

  const totalSpend = filtered.reduce((a, p) => a + p.total_cost, 0)
  const avgCost = filtered.length ? Math.round(totalSpend / filtered.length) : 0
  const activeCount = filtered.filter((p) => p.status !== 'Closed').length
  const largestDept = filtered.reduce<Record<string, number>>((acc, p) => {
    acc[p.department_name] = (acc[p.department_name] || 0) + p.total_cost
    return acc
  }, {})
  const largestDeptName = Object.entries(largestDept).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

  const clearFilters = () => {
    setDeptFilter('')
    setYearFilter(String(new Date().getFullYear()))
    setMonthFilter('')
  }

  return (
    <PageShell
      title="Analytics & Reporting"
      subtitle="Review spend trends, lifecycle distribution, and department activity with the same purchase-order logic already in production."
      departmentName={deptFilter || 'Ole Miss Athletics'}
      eyebrow="Reporting Workspace"
      statChips={[
        { label: 'Filtered POs', value: filtered.length },
        { label: 'Active', value: activeCount },
        { label: 'Spend', value: '$' + totalSpend.toLocaleString() },
      ]}
      actions={
        <>
          <button className="btn btn-subtle" onClick={clearFilters}>Reset</button>
          <button className="btn btn-primary" onClick={() => downloadCSV(filtered, `RebelTrack_${deptFilter || 'All'}_${yearFilter || 'All'}.csv`)}>
            Export filtered CSV
          </button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="role-panel">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Reporting focus</div>
            <h2 className="mt-2 font-display text-2xl tracking-[-0.02em] text-slate-900">Operational analytics for athletics purchasing</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Use this view to compare spend, surface bottlenecks in the PO lifecycle, and prepare cleaner exports for the business office.
            </p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-slate-700">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Filter context</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniMetric label="Department" value={deptFilter || 'All'} />
            <MiniMetric label="Year" value={yearFilter || 'All'} />
            <MiniMetric label="Month" value={monthFilter ? MONTHS_SHORT[parseInt(monthFilter)] : 'All'} />
            <MiniMetric label="Largest dept" value={largestDeptName} />
          </div>
        </div>
      </div>

      <div className="panel mb-6 p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
          <select className="form-input !w-auto !py-2 text-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select className="form-input !w-auto !py-2 text-sm" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-input !w-auto !py-2 text-sm" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS_SHORT.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="form-input !w-auto !py-2 text-sm" value={periodMode} onChange={(e) => setPeriodMode(e.target.value as 'monthly' | 'yearly')}>
            <option value="monthly">Monthly view</option>
            <option value="yearly">Yearly view</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Filtered POs" value={filtered.length} icon={Receipt} />
          <MetricCard label="Total spend" value={'$' + totalSpend.toLocaleString()} icon={TrendingUp} />
          <MetricCard label="Avg PO value" value={'$' + avgCost.toLocaleString()} icon={Layers3} />
          <MetricCard label="Active records" value={activeCount} icon={PieChart} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No analytics data matches the current filters"
          description="Clear the filters or widen the reporting period to bring records back into view."
          action={<button className="btn btn-primary" onClick={clearFilters}>Reset filters</button>}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title={`${periodMode === 'monthly' ? 'Monthly' : 'Yearly'} spend`} subtitle={deptFilter ? deptFilter : 'All departments'}>
              <canvas ref={spendRef} role="img" aria-label="Spend over time chart" />
            </ChartPanel>
            <ChartPanel title="PO count by status" subtitle="Lifecycle snapshot across filtered records">
              <canvas ref={statusRef} role="img" aria-label="PO count by status chart" />
            </ChartPanel>
            <ChartPanel title="Spend by category" subtitle="Useful for equipment and warranty planning" sideLegend={categoryLegend(filtered)} compact>
              <canvas ref={catRef} role="img" aria-label="Spend by category chart" />
            </ChartPanel>
            <ChartPanel title="Department comparison" subtitle="Relative spend by department">
              <canvas ref={deptRef} role="img" aria-label="Department comparison chart" />
            </ChartPanel>
          </div>

          <div className="panel overflow-hidden">
            <div className="panel-header justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Filtered purchase orders</div>
                <div className="text-xs text-slate-500">Latest records inside the current report context</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Department</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Order Date</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 10).map((po) => (
                    <tr key={po.id}>
                      <td className="font-semibold text-slate-900">{po.po_number}</td>
                      <td>{po.department_name}</td>
                      <td>{po.vendor_name}</td>
                      <td>{po.status}</td>
                      <td>{po.order_date || '—'}</td>
                      <td className="font-semibold text-slate-900">${po.total_cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageShell>
  )
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{value}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function ChartPanel({ title, subtitle, children, sideLegend, compact = false }: { title: string; subtitle: string; children: ReactNode; sideLegend?: ReactNode; compact?: boolean }) {
  return (
    <div className="panel p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl tracking-[-0.02em] text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className={`flex ${compact ? 'flex-col gap-4 sm:flex-row sm:items-center' : 'flex-col'} `}>
        <div className={`relative ${compact ? 'h-[180px] w-full sm:w-[180px] sm:flex-shrink-0' : 'h-[240px] w-full'}`}>{children}</div>
        {sideLegend ? <div className="flex-1">{sideLegend}</div> : null}
      </div>
    </div>
  )
}

function categoryLegend(filtered: PurchaseOrder[]) {
  const catSpend: Record<string, number> = {}
  filtered.forEach((p) => {
    catSpend[p.category || 'Other'] = (catSpend[p.category || 'Other'] || 0) + p.total_cost
  })
  const colors = ['#CE1126', '#185FA5', '#3B6D11', '#854F0B', '#534AB7', '#888780', '#C8A96E']
  return (
    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
      {Object.keys(catSpend).map((key, i) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span>{key}</span>
          </div>
          <span className="font-semibold text-slate-800">${Math.round(catSpend[key]).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
