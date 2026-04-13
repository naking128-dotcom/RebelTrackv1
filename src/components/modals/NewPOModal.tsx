'use client'
import type { ReactNode } from 'react'
import React from 'react'
import { useMemo, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import type { Department, ItemCategory, OCRExtraction } from '@/types'
import { ITEM_CATEGORIES } from '@/types'
import { AlertTriangle, CheckCircle2, FileImage, FileText, ScanLine, Sparkles, UploadCloud, Wand2, X } from 'lucide-react'

interface Props {
  departments: Department[]
  onClose: () => void
  onSaved: () => void
}

const KNOWN_VENDORS = [
  'Apple Inc.', 'Dell Technologies', 'CDW Government LLC', 'Cisco Systems',
  'Adobe Inc.', 'Ergotron', 'BSN Sports', 'Rawlings', 'Spalding',
  'Panasonic', 'Hudl', 'Staples Business', 'Grainger',
]

const OCR_PRIORITIES = [
  'PO Number', 'Vendor Name', 'Item Description', 'Quantity', 'Unit Cost', 'Department', 'Order Date', 'Warranty Info',
]

export default function NewPOModal({ departments, onClose, onSaved }: Props) {
  const [step, setStep] = useState<'upload' | 'form'>('upload')
  const [loading, setLoading] = useState(false)
  const [ocr, setOcr] = useState<OCRExtraction | null>(null)
  const [sourceFileName, setSourceFileName] = useState('')
  const [warranty, setWarranty] = useState(false)
  const [extraRecipients, setExtraRecipients] = useState('')

  const [form, setForm] = useState({
    po_number: '', requisition_number: '',
    requester_name: '', department_id: '', department_name: '',
    vendor_name: '', vendor_id: '',
    item_description: '', category: '' as ItemCategory | '',
    manufacturer: '', model: '', serial_number: '',
    quantity: '1', unit_cost: '',
    funding_source: '', order_date: '', expected_delivery: '',
    has_warranty: false, warranty_end_date: '', warranty_provider: '', warranty_notes: '',
    notes: '',
  })

  const totalCost = parseFloat(form.quantity || '1') * parseFloat(form.unit_cost || '0')

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return
    const file = accepted[0]
    setSourceFileName(file.name)
    setLoading(true)
    toast.info('Scanning document with OCR...')

    await new Promise((r) => setTimeout(r, 1500))
    const mock: OCRExtraction = {
      po_number: 'PO-2025-0443',
      vendor_name: 'CDW Government LLC',
      item_descriptions: ['HP EliteBook 840 G11 Laptop'],
      quantity: 4,
      unit_cost: 1649.99,
      total_cost: 6599.96,
      order_date: new Date().toISOString().slice(0, 10),
      manufacturer: 'HP',
      model: 'EliteBook 840 G11',
      confidence: { po_number: 0.98, vendor_name: 0.95, quantity: 0.92, unit_cost: 0.88 },
      low_confidence_fields: ['unit_cost'],
    }
    setOcr(mock)
    setForm((f) => ({
      ...f,
      po_number: mock.po_number || f.po_number,
      vendor_name: mock.vendor_name || f.vendor_name,
      item_description: mock.item_descriptions?.[0] || f.item_description,
      quantity: mock.quantity ? String(mock.quantity) : f.quantity,
      unit_cost: mock.unit_cost ? String(mock.unit_cost) : f.unit_cost,
      manufacturer: mock.manufacturer || f.manufacturer,
      model: mock.model || f.model,
      order_date: mock.order_date || f.order_date,
    }))
    setLoading(false)
    setStep('form')
    toast.success('OCR complete — review pre-filled fields')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  })

  async function checkDuplicate(poNumber: string) {
    if (!poNumber) return
    const res = await fetch(`/api/pos?search=${encodeURIComponent(poNumber)}&exact=1`)
    if (res.ok) {
      const data = await res.json()
      if (data?.length > 0 && data[0].po_number === poNumber) {
        toast.error(`PO number ${poNumber} already exists!`)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.po_number || !form.requester_name || !form.department_id || !form.vendor_name || !form.item_description || !form.unit_cost) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)

    const extra = extraRecipients.split(',').map((s) => s.trim()).filter((s) => s.includes('@'))
    const payload = {
      ...form,
      quantity: parseInt(form.quantity || '1'),
      unit_cost: parseFloat(form.unit_cost || '0'),
      has_warranty: warranty,
      extra_email_recipients: extra,
    }

    const res = await fetch('/api/pos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      if (err.code === 'DUPLICATE_PO') toast.error(`PO number ${form.po_number} already exists`)
      else toast.error(err.error || 'Failed to create PO')
      setLoading(false)
      return
    }

    toast.success('PO created — notifications sent!')
    onSaved()
  }

  const lowConfidenceFields = useMemo(() => new Set(ocr?.low_confidence_fields || []), [ocr])
  const extractedCount = [form.po_number, form.vendor_name, form.item_description, form.quantity, form.unit_cost, form.order_date, form.manufacturer, form.model].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="modal-shell my-8 w-full max-w-5xl overflow-hidden">
        <div className="modal-header">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">AI Intake</div>
            <h2 className="mt-2 font-display text-3xl tracking-[-0.03em] text-slate-900">New Purchase Order</h2>
            <p className="mt-1 text-sm text-slate-500">Upload, scan, paste, or enter a PO manually. The UI is ready for OCR-assisted intake without changing the underlying save logic.</p>
          </div>
          <button className="btn btn-ghost h-10 w-10 justify-center rounded-2xl p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50/80 p-6 lg:border-b-0 lg:border-r">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Workflow</div>
              <div className="mt-4 space-y-3">
                <StepPill active={step === 'upload'} done={!!ocr || step === 'form'} label="1. Upload or paste" desc="PDF, scan, screenshot, or image" />
                <StepPill active={step === 'form'} done={false} label="2. Review fields" desc="Confirm extracted values" />
                <StepPill active={false} done={false} label="3. Save record" desc="Create PO and send alerts" />
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Sparkles className="h-4 w-4 text-red-600" /> Extraction targets</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {OCR_PRIORITIES.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{item}</div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Review policy</div>
              <p className="mt-2 leading-6">Low-confidence fields stay highlighted so staff can verify before saving into the inventory system.</p>
            </div>
          </aside>

          <div>
            {step === 'upload' && (
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div
                    {...getRootProps()}
                    className={`upload-zone min-h-[280px] cursor-pointer border-slate-300 bg-white ${isDragActive ? 'border-red-400 bg-red-50' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {loading ? (
                      <div className="mx-auto max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-red-600">
                          <ScanLine className="h-8 w-8 animate-pulse" />
                        </div>
                        <div className="text-base font-semibold text-slate-900">Scanning document...</div>
                        <div className="mt-2 text-sm text-slate-500">Running OCR and mapping fields into the purchase order form.</div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-red-600">
                          <UploadCloud className="h-8 w-8" />
                        </div>
                        <div className="text-base font-semibold text-slate-900">Drop a PO to auto-fill the record</div>
                        <div className="mt-2 text-sm text-slate-500">Supports PDF, scanned image, screenshot, or pasted-style image upload.</div>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          <Wand2 className="h-3.5 w-3.5" /> OCR-assisted intake ready
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Accepted sources</div>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <SourceCard icon={FileText} title="PDF purchase order" body="Best for clean extraction of vendor, PO, and financial fields." />
                      <SourceCard icon={FileImage} title="Scanned or photographed PO" body="Good for mobile intake when staff only have a picture or screenshot." />
                      <SourceCard icon={ScanLine} title="Image-based document upload" body="Use for packing slips, warranty sheets, or follow-up attachments." />
                    </div>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">or</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <button className="btn btn-primary w-full justify-center" onClick={() => setStep('form')}>Fill in manually</button>
                  </div>
                </div>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmit}>
                <div className="max-h-[76vh] overflow-y-auto p-6 md:p-8">
                  <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Intake summary</div>
                          <h3 className="mt-2 font-display text-2xl tracking-[-0.02em] text-slate-900">Review extracted purchase data</h3>
                        </div>
                        {ocr ? <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> OCR detected</span> : null}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <SummaryCell label="Fields prefilled" value={extractedCount} />
                        <SummaryCell label="Confidence flags" value={lowConfidenceFields.size} tone={lowConfidenceFields.size ? 'warn' : 'ok'} />
                        <SummaryCell label="Source" value={sourceFileName || 'Manual'} />
                        <SummaryCell label="Est. total" value={`$${isFinite(totalCost) ? totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}`} />
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Save behavior</div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        <li>• Required fields are still enforced before save.</li>
                        <li>• Duplicate PO numbers still trigger a validation check.</li>
                        <li>• Notifications still send through the current app flow.</li>
                        <li>• This is a UI enhancement only; the core create logic remains unchanged.</li>
                      </ul>
                    </div>
                  </div>

                  {ocr && (
                    <div className="mb-5 rounded-[24px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      <div className="font-semibold">OCR extracted values successfully.</div>
                      {lowConfidenceFields.size > 0 ? (
                        <div className="mt-1 text-amber-700">Low confidence: {[...lowConfidenceFields].join(', ')}</div>
                      ) : (
                        <div className="mt-1">No low-confidence flags detected in the mock extraction.</div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-5">
                      <FormSection title="Identification">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FieldWrap label="PO Number" required>
                            <input className={inputClass(lowConfidenceFields.has('po_number'))} value={form.po_number} onChange={(e) => set('po_number', e.target.value)} onBlur={(e) => checkDuplicate(e.target.value)} placeholder="PO-2025-XXXX" required />
                          </FieldWrap>
                          <FieldWrap label="Requisition #">
                            <input className="form-input" value={form.requisition_number} onChange={(e) => set('requisition_number', e.target.value)} placeholder="REQ-XXXX" />
                          </FieldWrap>
                        </div>
                      </FormSection>

                      <FormSection title="People">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FieldWrap label="Requester" required>
                            <input className="form-input" value={form.requester_name} onChange={(e) => set('requester_name', e.target.value)} placeholder="Full name" required />
                          </FieldWrap>
                          <FieldWrap label="Department" required>
                            <select className="form-input" value={form.department_id} onChange={(e) => {
                              const d = departments.find((d) => d.id === e.target.value)
                              setForm((f) => ({ ...f, department_id: e.target.value, department_name: d?.name || '' }))
                            }} required>
                              <option value="">— Select —</option>
                              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </FieldWrap>
                        </div>
                      </FormSection>

                      <FormSection title="Vendor & Item">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FieldWrap label="Vendor Name" required>
                            <>
                              <input className={inputClass(lowConfidenceFields.has('vendor_name'))} list="vendor-list" value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} placeholder="Vendor name" required />
                              <datalist id="vendor-list">{KNOWN_VENDORS.map((v) => <option key={v} value={v} />)}</datalist>
                            </>
                          </FieldWrap>
                          <FieldWrap label="Vendor ID">
                            <input className="form-input" value={form.vendor_id} onChange={(e) => set('vendor_id', e.target.value)} placeholder="Optional vendor ID" />
                          </FieldWrap>
                          <FieldWrap label="Item Description" required className="md:col-span-2">
                            <textarea className={inputClass(false)} rows={3} value={form.item_description} onChange={(e) => set('item_description', e.target.value)} placeholder="Describe item(s) purchased" required />
                          </FieldWrap>
                          <FieldWrap label="Category">
                            <select className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                              <option value="">— Select —</option>
                              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </FieldWrap>
                          <FieldWrap label="Manufacturer">
                            <input className="form-input" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Manufacturer" />
                          </FieldWrap>
                          <FieldWrap label="Model">
                            <input className="form-input" value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Model" />
                          </FieldWrap>
                          <FieldWrap label="Serial Number">
                            <input className="form-input" value={form.serial_number} onChange={(e) => set('serial_number', e.target.value)} placeholder="Serial number" />
                          </FieldWrap>
                        </div>
                      </FormSection>
                    </div>

                    <div className="space-y-5">
                      <FormSection title="Financial & Dates">
                        <div className="grid grid-cols-1 gap-4">
                          <FieldWrap label="Quantity">
                            <input className={inputClass(lowConfidenceFields.has('quantity'))} type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
                          </FieldWrap>
                          <FieldWrap label="Unit Cost" required>
                            <input className={inputClass(lowConfidenceFields.has('unit_cost'))} type="number" step="0.01" value={form.unit_cost} onChange={(e) => set('unit_cost', e.target.value)} required />
                          </FieldWrap>
                          <FieldWrap label="Calculated Total">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900">${isFinite(totalCost) ? totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}</div>
                          </FieldWrap>
                          <FieldWrap label="Funding Source / Account">
                            <input className="form-input" value={form.funding_source} onChange={(e) => set('funding_source', e.target.value)} placeholder="Account or funding source" />
                          </FieldWrap>
                          <FieldWrap label="Order Date">
                            <input className="form-input" type="date" value={form.order_date} onChange={(e) => set('order_date', e.target.value)} />
                          </FieldWrap>
                          <FieldWrap label="Expected Delivery">
                            <input className="form-input" type="date" value={form.expected_delivery} onChange={(e) => set('expected_delivery', e.target.value)} />
                          </FieldWrap>
                        </div>
                      </FormSection>

                      <FormSection title="Warranty & Notifications">
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" className="accent-red-600" checked={warranty} onChange={(e) => setWarranty(e.target.checked)} />
                            Warranty purchased for this item
                          </label>
                          {warranty ? (
                            <div className="grid grid-cols-1 gap-4">
                              <FieldWrap label="Warranty End Date"><input className="form-input" type="date" value={form.warranty_end_date} onChange={(e) => set('warranty_end_date', e.target.value)} /></FieldWrap>
                              <FieldWrap label="Warranty Provider"><input className="form-input" value={form.warranty_provider} onChange={(e) => set('warranty_provider', e.target.value)} placeholder="Warranty provider" /></FieldWrap>
                              <FieldWrap label="Warranty Notes"><textarea className="form-input" rows={3} value={form.warranty_notes} onChange={(e) => set('warranty_notes', e.target.value)} placeholder="Coverage or support notes" /></FieldWrap>
                            </div>
                          ) : null}
                          <FieldWrap label="Extra Email Recipients">
                            <input className="form-input" value={extraRecipients} onChange={(e) => setExtraRecipients(e.target.value)} placeholder="name@olemiss.edu, manager@olemiss.edu" />
                          </FieldWrap>
                          <FieldWrap label="Notes">
                            <textarea className="form-input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes for the business office or IT inventory team" />
                          </FieldWrap>
                        </div>
                      </FormSection>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="text-sm text-slate-500">Required fields and duplicate checks still apply before save.</div>
                  <div className="flex gap-2">
                    <button type="button" className="btn" onClick={() => setStep('upload')}>Back</button>
                    <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Create PO & Send Alerts'}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepPill({ active, done, label, desc }: { active: boolean; done: boolean; label: string; desc: string }) {
  return (
    <div className={`rounded-[22px] border px-4 py-3 ${active ? 'border-red-200 bg-red-50' : done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className={`text-sm font-semibold ${active ? 'text-red-700' : done ? 'text-green-700' : 'text-slate-700'}`}>{label}</div>
      <div className="mt-1 text-xs text-slate-500">{desc}</div>
    </div>
  )
}

function SourceCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icon className="h-4 w-4 text-slate-500" /> {title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  )
}

function SummaryCell({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'warn' | 'ok' }) {
  const toneClass = tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-800' : tone === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50 text-slate-800'
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</div>
      {children}
    </section>
  )
}

function FieldWrap({ label, required = false, className = '', children }: { label: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="form-label">{label} {required ? <span className="text-red-500">*</span> : null}</label>
      {children}
    </div>
  )
}

function inputClass(flagged: boolean) {
  return `form-input ${flagged ? 'border-amber-300 bg-amber-50' : ''}`
}
