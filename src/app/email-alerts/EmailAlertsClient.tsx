'use client'
import { useState } from 'react'
import type { UserProfile } from '@/types'
import PageShell from '@/components/layout/PageShell'
import { toast } from 'sonner'

interface NotifSetting { event: string; enabled: boolean }
interface NotifPref    { event: string; enabled: boolean }
interface Props {
  settings: NotifSetting[]
  prefs: NotifPref[]
  profile: UserProfile
}

const EVENT_META: Record<string, { label: string; desc: string; recipients: string }> = {
  po_created:               { label: 'PO Created',               desc: 'Fires when any new PO is saved.',                       recipients: 'Requester, Dept Admin, Business Office' },
  status_ordered:           { label: 'Status: Ordered',          desc: 'PO advances to Ordered.',                              recipients: 'Requester, Dept Admin' },
  status_shipped:           { label: 'Status: Shipped',          desc: 'PO marked as Shipped.',                               recipients: 'Requester, Dept Admin' },
  status_delivered:         { label: 'Status: Delivered',        desc: 'Delivery confirmed.',                                 recipients: 'Requester, Dept Admin, Business Office' },
  status_received:          { label: 'Status: Received',         desc: 'Items physically received.',                          recipients: 'IT Admin, Dept Admin' },
  status_asset_tagged:      { label: 'Status: Asset Tagged',     desc: 'Asset tag number assigned.',                          recipients: 'IT Admin' },
  status_closed:            { label: 'Status: Closed',           desc: 'PO fully closed.',                                    recipients: 'Requester, Business Office' },
  warranty_90_days:         { label: 'Warranty — 90 days',       desc: '90 days before warranty expiry.',                     recipients: 'IT Admin, Dept Admin' },
  warranty_30_days:         { label: 'Warranty — 30 days',       desc: '30 days before warranty expiry.',                     recipients: 'IT Admin, Dept Admin' },
  warranty_quarterly_digest:{ label: 'Quarterly Warranty Digest',desc: 'Full report — Jan 1, Apr 1, Jul 1, Oct 1 at 8 AM CT.',recipients: 'All Admins' },
}

export default function EmailAlertsClient({ settings: initialSettings, prefs: initialPrefs, profile }: Props) {
  const [settings, setSettings] = useState<NotifSetting[]>(initialSettings)
  const [prefs, setPrefs]       = useState<NotifPref[]>(initialPrefs)
  const isAdmin = ['it_admin', 'business_office'].includes(profile.role)

  async function toggleSetting(event: string, enabled: boolean) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'system', event, enabled }),
      })
      setSettings(prev => prev.map(s => s.event === event ? { ...s, enabled } : s))
      toast.success(`${EVENT_META[event]?.label ?? event} ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to save — try again')
    }
  }

  async function togglePref(event: string, enabled: boolean) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'user', event, enabled }),
      })
      setPrefs(prev => {
        const existing = prev.find(p => p.event === event)
        if (existing) return prev.map(p => p.event === event ? { ...p, enabled } : p)
        return [...prev, { event, enabled }]
      })
      toast.success('Preference saved')
    } catch {
      toast.error('Failed to save — try again')
    }
  }

  const getSetting = (event: string) => settings.find(s => s.event === event)?.enabled ?? true
  const getPref    = (event: string) => prefs.find(p => p.event === event)?.enabled ?? false

  return (
    <PageShell title="Email Alerts" className="flex-1 overflow-y-auto">

      {/* System-wide settings (admin only) */}
      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">System-wide notification events</h2>
            <p className="text-xs text-slate-400 mt-0.5">Changes affect all users immediately.</p>
          </div>
          <div className="divide-y divide-slate-50">
            {Object.entries(EVENT_META).map(([event, meta]) => (
              <div key={event} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800">{meta.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{meta.desc}</div>
                  <div className="text-xs text-slate-300 mt-0.5">Recipients: {meta.recipients}</div>
                </div>
                <button
                  onClick={() => toggleSetting(event, !getSetting(event))}
                  className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${getSetting(event) ? 'bg-red-600' : 'bg-slate-300'}`}
                  aria-label={`Toggle ${meta.label}`}
                >
                  <span className={`absolute w-4 h-4 bg-white rounded-full top-[3px] transition-all shadow-sm ${getSetting(event) ? 'left-[21px]' : 'left-[3px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-user preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">My notification preferences</h2>
          <p className="text-xs text-slate-400 mt-0.5">Subscribe to specific events for your account.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(EVENT_META).map(([event, meta]) => (
            <div key={event} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800">{meta.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{meta.desc}</div>
              </div>
              <button
                onClick={() => togglePref(event, !getPref(event))}
                className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${getPref(event) ? 'bg-red-600' : 'bg-slate-300'}`}
                aria-label={`Toggle my ${meta.label}`}
              >
                <span className={`absolute w-4 h-4 bg-white rounded-full top-[3px] transition-all shadow-sm ${getPref(event) ? 'left-[21px]' : 'left-[3px]'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
