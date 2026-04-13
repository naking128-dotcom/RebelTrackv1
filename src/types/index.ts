// ============================================================
// RebelTrack — Core TypeScript Types
// ============================================================

export type POStatus =
  | 'PO Created'
  | 'Ordered'
  | 'Shipped'
  | 'Delivered'
  | 'Received'
  | 'Asset Tagged'
  | 'Closed'

export const PO_STATUS_FLOW: POStatus[] = [
  'PO Created',
  'Ordered',
  'Shipped',
  'Delivered',
  'Received',
  'Asset Tagged',
  'Closed',
]

export type UserRole = 'it_admin' | 'dept_admin' | 'business_office' | 'read_only'

export type ItemCategory =
  | 'Hardware'
  | 'Software'
  | 'Equipment'
  | 'Supplies'
  | 'Furniture'
  | 'AV / Media'
  | 'Other'

export type DocType = 'po_file' | 'invoice' | 'packing_slip' | 'warranty_doc' | 'other'

export type NotificationEvent =
  | 'po_created'
  | 'status_ordered'
  | 'status_shipped'
  | 'status_delivered'
  | 'status_received'
  | 'status_asset_tagged'
  | 'status_closed'
  | 'warranty_90_days'
  | 'warranty_30_days'
  | 'warranty_quarterly_digest'

// ============================================================
// Database row types
// ============================================================

export interface Department {
  id: string
  name: string
  parent_id: string | null
  head_user_id: string | null
  created_at: string
  updated_at: string
  // joined
  parent?: Department
  children?: Department[]
}

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
  department_id: string | null
  must_reset_pw: boolean
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  department?: Department
  full_name?: string
}

export interface Vendor {
  id: string
  vendor_id: string | null
  name: string
  contact: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  po_number: string
  requisition_number: string | null
  requester_id: string | null
  requester_name: string
  department_id: string | null
  department_name: string
  business_contact_id: string | null
  vendor_id: string | null
  vendor_name: string
  unit_cost: number
  quantity: number
  total_cost: number
  funding_source: string | null
  order_date: string | null
  expected_delivery: string | null
  actual_delivery: string | null
  received_date: string | null
  status: POStatus
  item_description: string
  category: ItemCategory | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  asset_tag: string | null
  building: string | null
  room: string | null
  custodian: string | null
  has_warranty: boolean
  warranty_end_date: string | null
  warranty_provider: string | null
  warranty_notes: string | null
  extra_email_recipients: string[] | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  department?: Department
  vendor?: Vendor
  requester?: UserProfile
  documents?: PODocument[]
  audit_log?: POAuditEntry[]
}

export interface PODocument {
  id: string
  po_id: string
  doc_type: DocType
  file_name: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface POAuditEntry {
  id: string
  po_id: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_by_name: string | null
  note: string | null
  created_at: string
}

export interface NotificationSetting {
  event: NotificationEvent
  enabled: boolean
  updated_at: string
}

export interface NotificationLog {
  id: string
  po_id: string | null
  event: NotificationEvent
  recipients: string[]
  subject: string
  sent_at: string
  success: boolean
  error_message: string | null
}

// ============================================================
// Form types
// ============================================================

export interface CreatePOInput {
  po_number: string
  requisition_number?: string
  requester_id?: string
  requester_name: string
  department_id: string
  department_name: string
  business_contact_id?: string
  vendor_id?: string
  vendor_name: string
  unit_cost: number
  quantity: number
  funding_source?: string
  order_date?: string
  expected_delivery?: string
  item_description: string
  category?: ItemCategory
  manufacturer?: string
  model?: string
  serial_number?: string
  has_warranty: boolean
  warranty_end_date?: string
  warranty_provider?: string
  warranty_notes?: string
  extra_email_recipients?: string[]
  notes?: string
}

export interface UpdatePOStatusInput {
  po_id: string
  status: POStatus
  note?: string
  asset_tag?: string
  building?: string
  room?: string
  custodian?: string
  received_date?: string
  actual_delivery?: string
}

export interface CreateUserInput {
  first_name: string
  last_name: string
  email: string
  role: UserRole
  department_id?: string
  password: string
  force_reset: boolean
  notify_po_created: boolean
  notify_status_changes: boolean
  notify_warranty: boolean
  notify_all_dept: boolean
}

// ============================================================
// API response types
// ============================================================

export interface DashboardStats {
  active_pos: number
  needs_tag: number
  closed: number
  total_spend: number
  ytd_spend: number
  warranty_expiring_90: number
}

export interface SpendByMonth {
  month: number
  month_name: string
  total_spend: number
  po_count: number
}

export interface SpendByDept {
  dept_name: string
  total_spend: number
  po_count: number
}

export interface POFilters {
  department_id?: string
  status?: POStatus
  year?: number
  month?: number
  search?: string
  has_warranty?: boolean
}

export interface ExportFilters {
  department_id?: string
  year?: number
  month?: number
  status?: POStatus
}

// ============================================================
// OCR extraction result
// ============================================================

export interface OCRExtraction {
  po_number?: string
  vendor_name?: string
  vendor_id?: string
  requester?: string
  department?: string
  item_descriptions?: string[]
  quantity?: number
  unit_cost?: number
  total_cost?: number
  order_date?: string
  expected_delivery?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  funding_source?: string
  warranty_info?: string
  confidence: Record<string, number>  // field -> 0-1 confidence score
  low_confidence_fields: string[]
  raw_text?: string
}

// ============================================================
// Constants
// ============================================================

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Hardware', 'Software', 'Equipment',
  'Supplies', 'Furniture', 'AV / Media', 'Other',
]

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'it_admin',        label: 'IT Admin' },
  { value: 'dept_admin',      label: 'Department Admin' },
  { value: 'business_office', label: 'Business Office' },
  { value: 'read_only',       label: 'Read Only' },
]

export const STATUS_BADGE_STYLES: Record<POStatus, { bg: string; text: string }> = {
  'PO Created':   { bg: '#e8edf5', text: '#0C447C' },
  'Ordered':      { bg: '#e6f1fb', text: '#185FA5' },
  'Shipped':      { bg: '#faeeda', text: '#854F0B' },
  'Delivered':    { bg: '#eaf3de', text: '#3B6D11' },
  'Received':     { bg: '#EAF3DE', text: '#27500A' },
  'Asset Tagged': { bg: '#fdf5e8', text: '#633806' },
  'Closed':       { bg: '#f1efe8', text: '#444441' },
}

export const DEPT_COLORS: Record<string, string> = {
  'Football':        '#CE1126',
  'Basketball':      '#185FA5',
  'Baseball':        '#3B6D11',
  'IT & Technology': '#854F0B',
  'Facilities':      '#534AB7',
  'Business Office': '#888780',
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]
