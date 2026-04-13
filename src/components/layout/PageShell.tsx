'use client'
import type { ReactNode } from 'react'

import BrandHero from '@/components/layout/BrandHero'

type PageShellProps = {
  title: string
  subtitle?: string
  departmentName?: string | null
  eyebrow?: string
  statChips?: Array<{ label: string; value: string | number }>
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export default function PageShell({
  title,
  subtitle,
  departmentName,
  eyebrow,
  statChips,
  actions,
  className,
  children,
}: PageShellProps) {
  return (
    <div className={["flex-1 overflow-y-auto px-6 py-6 animate-in", className].filter(Boolean).join(' ')}>
      <BrandHero
        title={title}
        subtitle={subtitle}
        departmentName={departmentName}
        eyebrow={eyebrow}
        statChips={statChips}
        actions={actions}
      />
      {children}
    </div>
  )
}
