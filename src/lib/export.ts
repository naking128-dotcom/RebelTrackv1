import type { PurchaseOrder, ExportFilters } from '@/types'

// ============================================================
// CSV Export Utilities
// ============================================================

const PO_HEADERS = [
  'PO Number', 'Requisition Number', 'Status',
  'Requester', 'Department', 'Business Contact',
  'Vendor Name', 'Vendor ID',
  'Item Description', 'Category', 'Manufacturer', 'Model', 'Serial Number',
  'Quantity', 'Unit Cost', 'Total Cost', 'Funding Source',
  'Order Date', 'Expected Delivery', 'Actual Delivery', 'Received Date',
  'Asset Tag', 'Building', 'Room', 'Custodian',
  'Warranty', 'Warranty End Date', 'Warranty Provider', 'Warranty Notes',
  'Notes', 'Created At',
]

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function poToRow(po: PurchaseOrder): string {
  const fields = [
    po.po_number,
    po.requisition_number,
    po.status,
    po.requester_name,
    po.department_name,
    po.business_contact_id || '',
    po.vendor_name,
    po.vendor?.vendor_id || '',
    po.item_description,
    po.category,
    po.manufacturer,
    po.model,
    po.serial_number,
    po.quantity,
    po.unit_cost,
    po.total_cost,
    po.funding_source,
    po.order_date,
    po.expected_delivery,
    po.actual_delivery,
    po.received_date,
    po.asset_tag,
    po.building,
    po.room,
    po.custodian,
    po.has_warranty ? 'Yes' : 'No',
    po.warranty_end_date,
    po.warranty_provider,
    po.warranty_notes,
    po.notes,
    new Date(po.created_at).toLocaleDateString('en-US'),
  ]
  return fields.map(escapeCSV).join(',')
}

export function generateCSV(pos: PurchaseOrder[]): string {
  const lines = [PO_HEADERS.join(','), ...pos.map(poToRow)]
  return lines.join('\n')
}

export function downloadCSV(pos: PurchaseOrder[], filename = 'RebelTrack_Export.csv') {
  const csv = generateCSV(pos)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildExportFilename(filters: ExportFilters): string {
  const parts = ['RebelTrack']
  if (filters.department_id) parts.push('Dept')
  if (filters.year) parts.push(String(filters.year))
  if (filters.month) parts.push(String(filters.month).padStart(2, '0'))
  if (filters.status) parts.push(filters.status.replace(/\s+/g, ''))
  parts.push(new Date().toISOString().slice(0, 10))
  return parts.join('_') + '.csv'
}

// Inventory-specific export
const INVENTORY_HEADERS = [
  'PO Number', 'Item Description', 'Category', 'Manufacturer', 'Model',
  'Serial Number', 'Asset Tag', 'Building', 'Room', 'Custodian',
  'Department', 'Status', 'Warranty', 'Warranty End Date',
]

export function generateInventoryCSV(pos: PurchaseOrder[]): string {
  const rows = pos.map(po => [
    po.po_number, po.item_description, po.category, po.manufacturer,
    po.model, po.serial_number, po.asset_tag, po.building, po.room,
    po.custodian, po.department_name, po.status,
    po.has_warranty ? 'Yes' : 'No', po.warranty_end_date,
  ].map(escapeCSV).join(','))
  return [INVENTORY_HEADERS.join(','), ...rows].join('\n')
}

// Warranty-specific export
const WARRANTY_HEADERS = [
  'PO Number', 'Item Description', 'Department', 'Vendor',
  'Warranty Provider', 'Warranty End Date', 'Days Remaining', 'Notes',
]

export function generateWarrantyCSV(pos: PurchaseOrder[]): string {
  const rows = pos
    .filter(p => p.has_warranty && p.warranty_end_date)
    .map(po => {
      const days = Math.round(
        (new Date(po.warranty_end_date!).getTime() - Date.now()) / 86400000
      )
      return [
        po.po_number, po.item_description, po.department_name,
        po.vendor_name, po.warranty_provider, po.warranty_end_date,
        days, po.warranty_notes,
      ].map(escapeCSV).join(',')
    })
  return [WARRANTY_HEADERS.join(','), ...rows].join('\n')
}
