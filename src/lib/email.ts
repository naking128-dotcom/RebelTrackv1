import { Resend } from 'resend'
import type { PurchaseOrder, NotificationEvent, POStatus } from '@/types'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Missing RESEND_API_KEY')
  }
  return new Resend(key)
}
const FROM = 'RebelTrack <noreply@rebeltrack.olemiss.edu>'
const REPLY_TO = 'athletics-it@olemiss.edu'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rebeltrack.olemiss.edu'

// ============================================================
// Brand colors
// ============================================================
const OM_RED   = '#CE1126'
const OM_NAVY  = '#0A1628'
const OM_GOLD  = '#C8A96E'

// ============================================================
// Base HTML wrapper — Ole Miss branded
// ============================================================
function baseEmail(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:${OM_NAVY};border-radius:10px 10px 0 0;padding:20px 28px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:48px;vertical-align:middle">
                  <div style="width:44px;height:44px;background:${OM_RED};border-radius:8px;text-align:center;line-height:44px;font-size:16px;font-weight:700;color:#fff">RT</div>
                </td>
                <td style="padding-left:12px;vertical-align:middle">
                  <div style="font-size:18px;font-weight:700;color:#fff">RebelTrack</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase">Ole Miss Athletics</div>
                </td>
                <td align="right" style="vertical-align:middle">
                  <div style="font-size:11px;color:${OM_GOLD};letter-spacing:1px;text-transform:uppercase">Hotty Toddy</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:28px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${OM_NAVY};border-radius:0 0 10px 10px;padding:16px 28px;text-align:center">
            <div style="font-size:12px;color:rgba(255,255,255,0.5)">
              RebelTrack &mdash; Ole Miss Athletics &bull;
              <a href="${APP_URL}" style="color:${OM_GOLD};text-decoration:none">Open Dashboard</a>
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:6px">
              This is an automated notification. To manage your alert preferences, visit your account settings.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ============================================================
// Status badge HTML
// ============================================================
function statusBadge(status: POStatus): string {
  const map: Record<POStatus, { bg: string; color: string }> = {
    'PO Created':   { bg: '#e8edf5', color: '#0C447C' },
    'Ordered':      { bg: '#e6f1fb', color: '#185FA5' },
    'Shipped':      { bg: '#faeeda', color: '#854F0B' },
    'Delivered':    { bg: '#eaf3de', color: '#3B6D11' },
    'Received':     { bg: '#EAF3DE', color: '#27500A' },
    'Asset Tagged': { bg: '#fdf5e8', color: '#633806' },
    'Closed':       { bg: '#f1efe8', color: '#444441' },
  }
  const s = map[status] || { bg: '#e8edf5', color: '#333' }
  return `<span style="display:inline-block;background:${s.bg};color:${s.color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">${status}</span>`
}

// ============================================================
// PO detail table
// ============================================================
function poDetailTable(po: PurchaseOrder): string {
  const rows: [string, string][] = [
    ['PO Number',    po.po_number],
    ['Vendor',       po.vendor_name],
    ['Item',         po.item_description],
    ['Department',   po.department_name],
    ['Quantity',     String(po.quantity)],
    ['Unit Cost',    `$${po.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Total',        `$${po.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Status',       po.status],
    ['Order Date',   po.order_date || '—'],
    ['Exp. Delivery',po.expected_delivery || '—'],
  ]
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;font-size:13px">
    ${rows.map(([label, val], i) => `
    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
      <td style="padding:8px 14px;color:#666;width:140px;font-weight:600">${label}</td>
      <td style="padding:8px 14px;color:#222">${label === 'Status' ? statusBadge(po.status) : val}</td>
    </tr>`).join('')}
  </table>`
}

// ============================================================
// Notification: PO Created
// ============================================================
export async function sendPOCreatedEmail(po: PurchaseOrder, recipients: string[]) {
  const subject = `[RebelTrack] New PO Created — ${po.po_number}`
  const body = `
    <h2 style="color:${OM_NAVY};font-size:20px;margin:0 0 6px">New Purchase Order Created</h2>
    <p style="color:#666;font-size:14px;margin:0 0 20px">A new purchase order has been submitted and is ready for processing.</p>
    ${poDetailTable(po)}
    <div style="background:${OM_RED};border-radius:8px;padding:14px;margin-top:20px;text-align:center">
      <a href="${APP_URL}/purchase-orders/${po.id}" 
         style="color:#fff;text-decoration:none;font-weight:700;font-size:14px">
        View &amp; Manage This PO &rarr;
      </a>
    </div>
    ${po.notes ? `<p style="margin-top:16px;font-size:13px;color:#666"><strong>Notes:</strong> ${po.notes}</p>` : ''}
  `
  return sendEmail(recipients, subject, baseEmail(subject, body))
}

// ============================================================
// Notification: Status Change
// ============================================================
export async function sendStatusChangeEmail(
  po: PurchaseOrder,
  oldStatus: POStatus,
  newStatus: POStatus,
  recipients: string[]
) {
  const subject = `[RebelTrack] PO ${po.po_number} — Status Updated to ${newStatus}`
  const messages: Partial<Record<POStatus, string>> = {
    'Ordered':      'The purchase order has been placed with the vendor.',
    'Shipped':      'Your order is on its way. Track delivery using the information in the PO.',
    'Delivered':    'The order has been delivered. Please confirm receipt.',
    'Received':     'Items received. Please complete asset tagging.',
    'Asset Tagged': 'Asset tags have been assigned. This PO is nearly complete.',
    'Closed':       'This purchase order has been fully processed and closed.',
  }
  const body = `
    <h2 style="color:${OM_NAVY};font-size:20px;margin:0 0 6px">Status Update</h2>
    <p style="color:#666;font-size:14px;margin:0 0 12px">${messages[newStatus] || 'The PO status has been updated.'}</p>
    <div style="display:flex;gap:10px;align-items:center;margin:16px 0;font-size:13px">
      <span style="color:#666">${oldStatus}</span>
      <span style="color:${OM_GOLD};font-size:18px">&rarr;</span>
      ${statusBadge(newStatus)}
    </div>
    ${poDetailTable(po)}
    <div style="background:${OM_NAVY};border-radius:8px;padding:14px;margin-top:20px;text-align:center">
      <a href="${APP_URL}/purchase-orders/${po.id}"
         style="color:#fff;text-decoration:none;font-weight:700;font-size:14px">
        View Full PO Details &rarr;
      </a>
    </div>
  `
  return sendEmail(recipients, subject, baseEmail(subject, body))
}

// ============================================================
// Notification: Warranty Alert
// ============================================================
export async function sendWarrantyAlertEmail(
  po: PurchaseOrder,
  daysRemaining: number,
  recipients: string[]
) {
  const isUrgent = daysRemaining <= 30
  const subject = `[RebelTrack] Warranty ${isUrgent ? 'EXPIRING SOON' : 'Alert'} — ${po.po_number} (${daysRemaining} days)`
  const accentColor = isUrgent ? '#CE1126' : '#BA7517'
  const body = `
    <div style="background:${isUrgent ? '#f8e5e8' : '#faeeda'};border-left:4px solid ${accentColor};border-radius:6px;padding:14px;margin-bottom:20px">
      <div style="font-size:15px;font-weight:700;color:${accentColor}">
        ${isUrgent ? '⚠ Warranty expiring in ' + daysRemaining + ' days' : 'Warranty expiring in ' + daysRemaining + ' days'}
      </div>
      <div style="font-size:13px;color:#555;margin-top:4px">
        Consider renewing or replacing this warranty before ${po.warranty_end_date}.
      </div>
    </div>
    <h2 style="color:${OM_NAVY};font-size:18px;margin:0 0 12px">Warranty Details</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;font-size:13px">
      <tr style="background:#f9f9f9"><td style="padding:8px 14px;color:#666;font-weight:600;width:140px">PO Number</td><td style="padding:8px 14px">${po.po_number}</td></tr>
      <tr><td style="padding:8px 14px;color:#666;font-weight:600">Item</td><td style="padding:8px 14px">${po.item_description}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px 14px;color:#666;font-weight:600">Department</td><td style="padding:8px 14px">${po.department_name}</td></tr>
      <tr><td style="padding:8px 14px;color:#666;font-weight:600">Provider</td><td style="padding:8px 14px">${po.warranty_provider || '—'}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px 14px;color:#666;font-weight:600">Expiry Date</td><td style="padding:8px 14px;font-weight:700;color:${accentColor}">${po.warranty_end_date}</td></tr>
    </table>
    <div style="background:${OM_RED};border-radius:8px;padding:14px;margin-top:20px;text-align:center">
      <a href="${APP_URL}/warranties" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px">
        View All Warranties &rarr;
      </a>
    </div>
  `
  return sendEmail(recipients, subject, baseEmail(subject, body))
}

// ============================================================
// Notification: Quarterly warranty digest
// ============================================================
export async function sendWarrantyQuarterlyDigest(
  warranties: PurchaseOrder[],
  recipients: string[]
) {
  const subject = `[RebelTrack] Quarterly Warranty Report — Ole Miss Athletics`
  const rows = warranties.map((po, i) => {
    const end = new Date(po.warranty_end_date!)
    const days = Math.round((end.getTime() - Date.now()) / 86400000)
    const color = days < 90 ? '#CE1126' : days < 365 ? '#BA7517' : '#3B6D11'
    return `
    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
      <td style="padding:8px 12px;font-size:12px">${po.po_number}</td>
      <td style="padding:8px 12px;font-size:12px">${po.item_description}</td>
      <td style="padding:8px 12px;font-size:12px">${po.department_name}</td>
      <td style="padding:8px 12px;font-size:12px">${po.warranty_end_date}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:700;color:${color}">${days}d</td>
    </tr>`
  }).join('')

  const body = `
    <h2 style="color:${OM_NAVY};font-size:20px;margin:0 0 6px">Quarterly Warranty Report</h2>
    <p style="color:#666;font-size:14px;margin:0 0 20px">
      This is your automated quarterly summary of all active warranties for Ole Miss Athletics equipment and assets.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;font-size:13px">
      <thead>
        <tr style="background:${OM_NAVY}">
          <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">PO #</th>
          <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Item</th>
          <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Dept</th>
          <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Expires</th>
          <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Days</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:16px;font-size:12px;color:#666">
      <span style="color:#CE1126;font-weight:700">Red</span> = expiring within 90 days &nbsp;&bull;&nbsp;
      <span style="color:#BA7517;font-weight:700">Amber</span> = expiring within 1 year &nbsp;&bull;&nbsp;
      <span style="color:#3B6D11;font-weight:700">Green</span> = more than 1 year remaining
    </div>
    <div style="background:${OM_RED};border-radius:8px;padding:14px;margin-top:20px;text-align:center">
      <a href="${APP_URL}/warranties" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px">
        View Warranty Dashboard &rarr;
      </a>
    </div>
  `
  return sendEmail(recipients, subject, baseEmail(subject, body))
}

// ============================================================
// Notification: Welcome / new user
// ============================================================
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  role: string
) {
  const subject = `Welcome to RebelTrack — Ole Miss Athletics`
  const body = `
    <h2 style="color:${OM_NAVY};font-size:20px;margin:0 0 6px">Welcome to RebelTrack</h2>
    <p style="color:#666;font-size:14px;margin:0 0 20px">Hi ${firstName}, your account has been created. Use the credentials below to sign in.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:20px">
      <tr style="background:#f9f9f9"><td style="padding:10px 14px;font-weight:600;color:#666;width:130px">Login URL</td><td style="padding:10px 14px"><a href="${APP_URL}" style="color:${OM_RED}">${APP_URL}</a></td></tr>
      <tr><td style="padding:10px 14px;font-weight:600;color:#666">Email</td><td style="padding:10px 14px">${email}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:10px 14px;font-weight:600;color:#666">Temp Password</td><td style="padding:10px 14px;font-family:monospace;font-size:15px;font-weight:700">${tempPassword}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600;color:#666">Your Role</td><td style="padding:10px 14px">${role}</td></tr>
    </table>
    <div style="background:#faeeda;border-left:4px solid #BA7517;border-radius:6px;padding:12px;font-size:13px;color:#633806;margin-bottom:20px">
      You will be required to change your password on first login.
    </div>
    <div style="background:${OM_RED};border-radius:8px;padding:14px;text-align:center">
      <a href="${APP_URL}/login" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px">
        Sign In to RebelTrack &rarr;
      </a>
    </div>
  `
  return sendEmail([email], subject, baseEmail(subject, body))
}

// ============================================================
// Core send function
// ============================================================
async function sendEmail(to: string[], subject: string, html: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Skipping email send for:', subject)
      return { success: false, error: new Error('Missing RESEND_API_KEY') }
    }
    const result = await getResend().emails.send({ from: FROM, reply_to: REPLY_TO, to, subject, html })
    return { success: true, data: result }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}
