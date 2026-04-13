export function LoadingCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-[26px] border border-slate-200/80 bg-white ${className}`} />
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-2xl border border-slate-200/80 bg-white" />
      ))}
    </div>
  )
}
