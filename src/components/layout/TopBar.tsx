'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PurchaseOrder } from '@/types'
import { Bell, Plus, Search, Sparkles } from 'lucide-react'

type TopBarProps = {
  title: string
  onNewPO?: () => void
  departmentName?: string | null
  roleLabel?: string | null
}

export default function TopBar({ title, onNewPO, departmentName, roleLabel }: TopBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PurchaseOrder[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const t = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('purchase_orders')
        .select('id, po_number, vendor_name, item_description, department_name, status, total_cost')
        .or(
          `po_number.ilike.%${query}%,` +
            `vendor_name.ilike.%${query}%,` +
            `item_description.ilike.%${query}%,` +
            `department_name.ilike.%${query}%,` +
            `requester_name.ilike.%${query}%`
        )
        .limit(8)
      setResults((data as PurchaseOrder[]) || [])
      setOpen(true)
      setLoading(false)
    }, 220)

    return () => clearTimeout(t)
  }, [query, supabase])

  function handleSelect(po: PurchaseOrder) {
    setQuery('')
    setOpen(false)
    router.push(`/purchase-orders/${po.id}`)
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-700">
              <Sparkles className="h-3.5 w-3.5" />
              RebelTrack Workspace
            </div>
            {departmentName ? <div className="topbar-chip">{departmentName}</div> : null}
            {roleLabel ? <div className="topbar-chip topbar-chip-muted">{roleLabel}</div> : null}
          </div>
          <h1 className="mt-3 font-display text-[30px] leading-none tracking-[-0.03em] text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">Ole Miss Athletics purchase order and inventory operations</p>
        </div>

        <div className="xl:ml-auto flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[300px]" ref={ref}>
            <div className="glass-strip flex items-center gap-2 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Search PO, vendor, item, requester..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setOpen(true)}
              />
              {loading ? <span className="text-xs text-slate-400">...</span> : null}
            </div>

            {open ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_28px_60px_rgba(15,23,42,0.16)]">
                {results.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-400">No results found</div>
                ) : (
                  results.map((po) => (
                    <button
                      key={po.id}
                      className="w-full border-b border-slate-100 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                      onClick={() => handleSelect(po)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{po.po_number}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="truncate text-sm text-slate-600">{po.vendor_name}</span>
                        <span className="ml-auto text-xs font-medium text-slate-500">${po.total_cost?.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-400">
                        {po.item_description} • {po.department_name} • {po.status}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <button className="glass-strip inline-flex h-12 w-12 items-center justify-center text-slate-600 transition-colors hover:bg-white">
            <Bell className="h-4 w-4" />
          </button>

          {onNewPO ? (
            <button className="btn btn-primary h-12 rounded-2xl px-5" onClick={onNewPO}>
              <Plus className="h-4 w-4" />
              New PO
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
