'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'
import { getDepartmentTheme } from '@/lib/department-theme'
import {
  BarChart3,
  Building2,
  CircleDot,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeColor?: string
}

const NAV_MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList, badge: 12 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/inventory', label: 'Inventory', icon: CircleDot },
  { href: '/warranties', label: 'Warranties', icon: ShieldCheck, badge: 3, badgeColor: '#BA7517' },
]

const NAV_ADMIN: NavItem[] = [
  { href: '/users', label: 'Users & Roles', icon: Users },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/email-alerts', label: 'Email Alerts', icon: Mail },
  { href: '/reports', label: 'Reports', icon: FileSpreadsheet },
]

interface SidebarProps {
  user: UserProfile | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = user?.role === 'it_admin'
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'RT'
  const departmentName = user?.department?.name || null
  const theme = getDepartmentTheme(departmentName)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex w-[276px] shrink-0 h-screen sticky top-0 text-white border-r border-white/6" style={{ background: 'linear-gradient(180deg, #09111f 0%, #0b1830 100%)' }}>
      <div className="flex w-full flex-col px-4 py-5">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: theme.fallbackGradient }} />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold shadow-lg" style={{ background: theme.accent }}>
              RT
            </div>
            <div>
              <div className="font-display text-xl leading-none tracking-[-0.02em]">RebelTrack</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/50">Ole Miss Athletics</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d1729] px-3 py-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
              <Shield className="h-3.5 w-3.5" />
              {theme.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Purchasing, inventory, warranty, and reporting in one branded athletics workspace.
            </p>
          </div>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto space-y-5 pr-1">
          <NavSection title="Operations" items={NAV_MAIN} pathname={pathname} accent={theme.accent} />
          {isAdmin ? <NavSection title="Administration" items={NAV_ADMIN} pathname={pathname} accent={theme.accent} /> : null}
        </nav>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold" style={{ background: theme.fallbackGradient }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </div>
              <div className="truncate text-xs uppercase tracking-[0.18em] text-white/45">
                {user?.role?.replace('_', ' ') || 'user'}
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavSection({ title, items, pathname, accent }: { title: string; items: NavItem[]; pathname: string; accent: string }) {
  return (
    <div>
      <div className="px-3 text-[11px] uppercase tracking-[0.24em] text-white/35">{title}</div>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} accent={accent} />
        ))}
      </div>
    </div>
  )
}

function NavLink({ item, pathname, accent }: { item: NavItem; pathname: string; accent: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
        active
          ? 'text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
      }`}
      style={active ? { background: `linear-gradient(90deg, ${accent}33, rgba(19,41,75,0.30))` } : undefined}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${active ? 'border-white/12 bg-white/[0.08]' : 'border-transparent bg-white/[0.03]'} transition-all`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="flex-1 text-sm font-medium">{item.label}</span>
      {item.badge !== undefined ? (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: item.badgeColor || accent }}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  )
}
