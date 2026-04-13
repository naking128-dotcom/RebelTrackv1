'use client'
import type { ReactNode } from 'react'

import { getDepartmentTheme } from '@/lib/department-theme'
import { Building2, ShieldCheck, Sparkles } from 'lucide-react'

type BrandHeroProps = {
  title: string
  subtitle?: string
  departmentName?: string | null
  eyebrow?: string
  statChips?: Array<{ label: string; value: string | number }>
  actions?: ReactNode
}

function PatternOverlay({ pattern }: { pattern: ReturnType<typeof getDepartmentTheme>['pattern'] }) {
  if (pattern === 'court') {
    return <div className="hero-pattern hero-pattern-court" aria-hidden="true" />
  }
  if (pattern === 'field') {
    return <div className="hero-pattern hero-pattern-field" aria-hidden="true" />
  }
  if (pattern === 'diamond') {
    return <div className="hero-pattern hero-pattern-diamond" aria-hidden="true" />
  }
  if (pattern === 'track') {
    return <div className="hero-pattern hero-pattern-track" aria-hidden="true" />
  }
  return <div className="hero-pattern hero-pattern-grid" aria-hidden="true" />
}

export default function BrandHero({
  title,
  subtitle,
  departmentName,
  eyebrow = 'Operations Platform',
  statChips = [],
  actions,
}: BrandHeroProps) {
  const theme = getDepartmentTheme(departmentName)

  return (
    <section className="brand-hero rounded-[28px] border border-white/10 shadow-[0_24px_60px_rgba(10,22,40,0.24)] overflow-hidden mb-6">
      <div
        className="brand-hero-bg"
        style={{ backgroundImage: theme.heroImage ? `linear-gradient(180deg, rgba(10,22,40,0.18), rgba(10,22,40,0.72)), url(${theme.heroImage}), ${theme.fallbackGradient}` : theme.fallbackGradient }}
      />
      <PatternOverlay pattern={theme.pattern} />
      <div className="brand-hero-glow" style={{ background: `radial-gradient(circle at top right, ${theme.accentSoft}, transparent 38%)` }} />

      <div className="relative z-10 p-6 md:p-8 text-white">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/75">
              <Building2 className="h-4 w-4" />
              <span>{theme.label}</span>
              <span className="text-white/40">•</span>
              <ShieldCheck className="h-4 w-4" />
              <span>{theme.wordmark}</span>
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-5xl leading-[0.95] tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm md:text-base text-white/80 leading-6">
                {subtitle}
              </p>
            )}
            {statChips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {statChips.map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-2xl border border-white/14 bg-white/12 px-4 py-2 backdrop-blur-sm"
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{chip.label}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{chip.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  )
}
