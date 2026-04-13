'use client'
import type { ReactNode } from 'react'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PO_STATUS_FLOW, type PurchaseOrder, type POStatus } from '@/types'
import { downloadCSV } from '@/lib/export'
import StatusBadge from '@/components/ui/StatusBadge'
import { toast } from 'sonner'
import { FileDown, X } from 'lucide-react'

export default function PODetailModal({
  po,
  onClose,
  onUpdated,
}: {
  po: PurchaseOrder
  onClose: () => void
  onUpdated: () => void
}) {
  const supabase = createClient()
  const [status, setStatus] = useState<POStatus>(po.status)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'details' | 'inventory' | 'docs' | 'audit'>('details')
  const [assetTag, setAssetTag] = useState(po.asset_tag || '')
  const [building, setBuilding] = useState(po.building || '')
  const [room, setRoom] = useState(po.room || '')
  const [custodian, setCustodian] = useState(po.custodian || '')

  const statusIndex = PO_STATUS_FLOW.indexOf(status)
  const currentIndex = PO_STATUS_FLOW.indexOf(po.status)

  async function handleUpdate() {
    setLoading(true)
    const payload: Record<string, any> = {
      status,
      asset_tag: assetTag || null,
      building: building || null,
      room: room || null,
      custodian: custodian || null,
      actual_delivery: status === 'Delivered' && !po.actual_delivery ? new Date().toISOString().slice(0, 10) : po.actual_delivery,
      received_date: status === 'Received' && !po.received_date ? new Date().toISOString().slice(0, 10) : po.received_date,
    }

    const { error } = await supabase.from('purchase_orders').update(payload).eq('id', po.id)
    if (error) {
      toast.error(error.message || 'Update failed')
      setLoading(false)
      return
    }

    if (note.trim()) {
      await supabase.from('po_audit_log').insert({
        po_id: po.id,
        field_changed: 'status',
        old_value: po.status,
        new_value: status,
        note: note.trim(),
      })
    }

    toast.success('Purchase order updated')
    setLoading(false)
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="modal-shell animate-in max-h-[92vh] w-full max-w-5xl overflow-hidden">
        <div className="modal-header">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Purchase Order Detail</div>
            <h2 className="mt-2 font-display text-3xl tracking-[-0.03em] text-slate-900">{po.po_number}</h2>
            <p className="mt-1 text-sm text-slate-500">{po.item_description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => downloadCSV([po], `${po.po_number}.csv`)}>
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button className="btn btn-ghost h-10 w-10 justify-center rounded-2xl p-0" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <div className="detail-chip"><span className="label">Vendor</span><span className="value">{po.vendor_name}</span></div>
            <div className="detail-chip"><span className="label">Department</span><span className="value">{po.department_name}</span></div>
            <div className="detail-chip"><span className="label">Total</span><span className="value">${po.total_cost.toLocaleString()}</span></div>
            <div className="detail-chip"><span className="label">Current status</span><span className="value">{po.status}</span></div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
            {PO_STATUS_FLOW.map((s, i) => (
              <div
                key={s}
                className="rounded-2xl border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  background: i < statusIndex ? '#CE1126' : i === statusIndex ? '#C8A96E' : '#f8fafc',
                  color: i < statusIndex ? '#fff' : i === statusIndex ? '#412402' : '#64748b',
                  borderColor: i < statusIndex ? '#CE1126' : i === statusIndex ? '#C8A96E' : '#e2e8f0',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_220px_1fr_auto] lg:items-center">
            <StatusBadge status={status} />
            <select className="form-input !py-2" value={status} onChange={(e) => setStatus(e.target.value as POStatus)}>
              {PO_STATUS_FLOW.map((s) => (
                <option key={s} value={s} disabled={PO_STATUS_FLOW.indexOf(s) < currentIndex}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="form-input !py-2"
              placeholder="Optional note for audit log..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn btn-primary justify-center" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Update & Notify'}
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 px-6">
          {(['details', 'inventory', 'docs', 'audit'] as const).map((t) => (
            <button
              key={t}
              className={`modal-tab ${tab === t ? 'modal-tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'docs' ? 'Documents' : t === 'audit' ? 'Audit Log' : t}
            </button>
          ))}
        </div>

        <div className="max-h-[48vh] overflow-y-auto p-6">
          {tab === 'details' && (
            <div className="space-y-5">
              <Section title="Purchase Order">
                <Grid2>
                  <Field label="PO Number" value={po.po_number} />
                  <Field label="Req #" value={po.requisition_number} />
                  <Field label="Requester" value={po.requester_name} />
                  <Field label="Department" value={po.department_name} />
                  <Field label="Vendor" value={po.vendor_name} />
                  <Field label="Funding Source" value={po.funding_source} />
                </Grid2>
              </Section>
              <Section title="Item & Financial">
                <Grid2>
                  <Field label="Description" value={po.item_description} span={2} />
                  <Field label="Category" value={po.category} />
                  <Field label="Manufacturer" value={po.manufacturer} />
                  <Field label="Model" value={po.model} />
                  <Field label="Serial #" value={po.serial_number} />
                  <Field label="Qty" value={String(po.quantity)} />
                  <Field label="Unit Cost" value={`$${po.unit_cost.toLocaleString()}`} />
                  <Field label="Total Cost" value={`$${po.total_cost.toLocaleString()}`} accent />
                </Grid2>
              </Section>
              <Section title="Timeline">
                <Grid2>
                  <Field label="Order Date" value={po.order_date} />
                  <Field label="Expected Delivery" value={po.expected_delivery} />
                  <Field label="Actual Delivery" value={po.actual_delivery} />
                  <Field label="Received Date" value={po.received_date} />
                </Grid2>
              </Section>
              {po.has_warranty && (
                <Section title="Warranty">
                  <Grid2>
                    <Field label="End Date" value={po.warranty_end_date} />
                    <Field label="Provider" value={po.warranty_provider} />
                    <Field label="Notes" value={po.warranty_notes} span={2} />
                  </Grid2>
                </Section>
              )}
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-5">
              <Section title="Asset Information">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InputField label="Asset Tag" value={assetTag} onChange={setAssetTag} placeholder="OMA-YYYY-XXXX" />
                  <InputField label="Building" value={building} onChange={setBuilding} placeholder="e.g. Manning Center" />
                  <InputField label="Room" value={room} onChange={setRoom} placeholder="Room number" />
                  <InputField label="Custodian" value={custodian} onChange={setCustodian} placeholder="Responsible person" />
                </div>
              </Section>
            </div>
          )}

          {tab === 'docs' && (
            <div className="space-y-3">
              {['PO File', 'Invoice', 'Packing Slip', 'Warranty Document'].map((docType) => (
                <div key={docType} className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <span className="text-sm font-medium text-slate-700">{docType}</span>
                  <label className="btn btn-sm cursor-pointer">
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg" />
                    Attach
                  </label>
                </div>
              ))}
              {po.documents && po.documents.length > 0 && (
                <div className="mt-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Attached files</h3>
                  <div className="mt-3 space-y-2">
                    {po.documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <span>📎</span>
                        <span>{d.file_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'audit' && (
            <div>
              {po.audit_log && po.audit_log.length > 0 ? (
                <div className="space-y-3">
                  {po.audit_log.map((entry) => (
                    <div key={entry.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800">{entry.field_changed}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-500">
                        {entry.old_value} → <span className="font-medium text-slate-700">{entry.new_value}</span>
                      </div>
                      {entry.note && <div className="mt-2 italic text-slate-400">{entry.note}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">No audit entries yet</div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 border-b border-slate-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      {children}
    </div>
  )
}
function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
}
function Field({ label, value, span, accent }: { label: string; value?: string | null; span?: number; accent?: boolean }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`text-sm font-medium ${accent ? 'text-red-600' : 'text-slate-900'}`}>
        {value || <span className="text-slate-300">—</span>}
      </div>
    </div>
  )
}
function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input className="form-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
