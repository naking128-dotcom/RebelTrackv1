import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon || <Inbox className="h-5 w-5" />}</div>
      <div>
        <h3 className="font-display text-2xl tracking-[-0.02em] text-slate-900">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
