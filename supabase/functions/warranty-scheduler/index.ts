// supabase/functions/warranty-scheduler/index.ts
// Deploy with: supabase functions deploy warranty-scheduler
// Schedule via Supabase Dashboard > Database > pg_cron:
//   SELECT cron.schedule('warranty-check', '0 8 * * *', 'SELECT net.http_post(...)');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const APP_URL   = Deno.env.get('APP_URL')    || 'https://rebeltrack.olemiss.edu'
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM      = 'RebelTrack <noreply@rebeltrack.olemiss.edu>'

Deno.serve(async (req) => {
  const today    = new Date()
  const in30     = new Date(today); in30.setDate(today.getDate() + 30)
  const in90     = new Date(today); in90.setDate(today.getDate() + 90)
  const todayStr = today.toISOString().slice(0, 10)

  // -----------------------------------------------------------
  // 1. 30-day alerts
  // -----------------------------------------------------------
  const { data: expiring30 } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('has_warranty', true)
    .gte('warranty_end_date', todayStr)
    .lte('warranty_end_date', in30.toISOString().slice(0,10))

  for (const po of expiring30 || []) {
    const setting = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('event','warranty_30_days')
      .single()
    if (!setting.data?.enabled) continue

    const days = Math.round((new Date(po.warranty_end_date).getTime() - today.getTime()) / 86400000)
    const recipients = await getAdminEmails()
    if (recipients.length) {
      await sendWarrantyAlert(po, days, recipients, true)
      await supabase.from('notification_log').insert({
        po_id: po.id, event: 'warranty_30_days', recipients,
        subject: `[RebelTrack] Warranty expiring in ${days} days — ${po.po_number}`,
      })
    }
  }

  // -----------------------------------------------------------
  // 2. 90-day alerts (only for those not already in 30-day window)
  // -----------------------------------------------------------
  const { data: expiring90 } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('has_warranty', true)
    .gt('warranty_end_date', in30.toISOString().slice(0,10))
    .lte('warranty_end_date', in90.toISOString().slice(0,10))

  for (const po of expiring90 || []) {
    const setting = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('event','warranty_90_days')
      .single()
    if (!setting.data?.enabled) continue

    const days = Math.round((new Date(po.warranty_end_date).getTime() - today.getTime()) / 86400000)
    const recipients = await getAdminEmails()
    if (recipients.length) {
      await sendWarrantyAlert(po, days, recipients, false)
      await supabase.from('notification_log').insert({
        po_id: po.id, event: 'warranty_90_days', recipients,
        subject: `[RebelTrack] Warranty alert — ${po.po_number} (${days} days)`,
      })
    }
  }

  // -----------------------------------------------------------
  // 3. Quarterly digest (runs on 1st of Jan, Apr, Jul, Oct)
  // -----------------------------------------------------------
  const isQuarter = [1, 4, 7, 10].includes(today.getMonth() + 1) && today.getDate() === 1
  if (isQuarter) {
    const { data: allWarranties } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('has_warranty', true)
      .gte('warranty_end_date', todayStr)
      .order('warranty_end_date')

    const setting = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('event','warranty_quarterly_digest')
      .single()

    if (setting.data?.enabled && allWarranties?.length) {
      const recipients = await getAdminEmails()
      if (recipients.length) {
        await sendQuarterlyDigest(allWarranties, recipients)
        await supabase.from('notification_log').insert({
          event: 'warranty_quarterly_digest', recipients,
          subject: `[RebelTrack] Quarterly Warranty Report — Ole Miss Athletics`,
        })
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, ran: today.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabase
    .from('user_profiles')
    .select('email')
    .in('role', ['it_admin', 'dept_admin'])
    .eq('is_active', true)
  return (data || []).map((u: any) => u.email)
}

async function sendEmail(to: string[], subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
}

async function sendWarrantyAlert(po: any, days: number, to: string[], urgent: boolean) {
  const color = urgent ? '#CE1126' : '#BA7517'
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#0A1628;padding:20px 28px">
        <div style="font-size:18px;font-weight:700;color:#fff">RebelTrack — Ole Miss Athletics</div>
      </div>
      <div style="padding:28px">
        <div style="background:${urgent?'#f8e5e8':'#faeeda'};border-left:4px solid ${color};border-radius:6px;padding:14px;margin-bottom:20px">
          <div style="font-size:15px;font-weight:700;color:${color}">Warranty expiring in ${days} days</div>
          <div style="font-size:13px;color:#555;margin-top:4px">PO ${po.po_number} — ${po.item_description}</div>
        </div>
        <table style="width:100%;border:1px solid #e8e8e8;border-radius:8px;font-size:13px;border-collapse:collapse">
          <tr style="background:#f9f9f9"><td style="padding:8px 14px;color:#666;font-weight:600">Dept</td><td style="padding:8px 14px">${po.department_name}</td></tr>
          <tr><td style="padding:8px 14px;color:#666;font-weight:600">Provider</td><td style="padding:8px 14px">${po.warranty_provider||'—'}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px 14px;color:#666;font-weight:600">Expires</td><td style="padding:8px 14px;font-weight:700;color:${color}">${po.warranty_end_date}</td></tr>
        </table>
        <div style="text-align:center;margin-top:20px">
          <a href="${APP_URL}/warranties" style="background:#CE1126;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Warranties Dashboard</a>
        </div>
      </div>
    </div>
  </body></html>`
  await sendEmail(to, `[RebelTrack] Warranty ${urgent?'EXPIRING SOON':'Alert'} — ${po.po_number} (${days}d)`, html)
}

async function sendQuarterlyDigest(warranties: any[], to: string[]) {
  const rows = warranties.map((po, i) => {
    const days  = Math.round((new Date(po.warranty_end_date).getTime() - Date.now()) / 86400000)
    const color = days < 90 ? '#CE1126' : days < 365 ? '#BA7517' : '#3B6D11'
    return `<tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
      <td style="padding:8px 12px;font-size:12px">${po.po_number}</td>
      <td style="padding:8px 12px;font-size:12px">${po.item_description}</td>
      <td style="padding:8px 12px;font-size:12px">${po.department_name}</td>
      <td style="padding:8px 12px;font-size:12px">${po.warranty_end_date}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:700;color:${color}">${days}d</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#0A1628;padding:20px 28px">
        <div style="font-size:18px;font-weight:700;color:#fff">RebelTrack — Quarterly Warranty Report</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">Ole Miss Athletics</div>
      </div>
      <div style="padding:28px">
        <p style="font-size:14px;color:#666;margin:0 0 20px">Your automated quarterly warranty summary. ${warranties.length} active warranties on file.</p>
        <table style="width:100%;border:1px solid #e8e8e8;border-radius:8px;border-collapse:collapse">
          <thead><tr style="background:#0A1628">
            <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px">PO #</th>
            <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px">Item</th>
            <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px">Dept</th>
            <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px">Expires</th>
            <th style="padding:10px 12px;color:#fff;text-align:left;font-size:11px">Days</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:16px;font-size:12px;color:#666">
          <span style="color:#CE1126;font-weight:700">Red</span> = within 90 days &nbsp;·&nbsp;
          <span style="color:#BA7517;font-weight:700">Amber</span> = within 1 year &nbsp;·&nbsp;
          <span style="color:#3B6D11;font-weight:700">Green</span> = 1+ year remaining
        </div>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/warranties" style="background:#CE1126;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Open Warranty Dashboard</a>
        </div>
      </div>
    </div>
  </body></html>`

  await sendEmail(to, '[RebelTrack] Quarterly Warranty Report — Ole Miss Athletics', html)
}
