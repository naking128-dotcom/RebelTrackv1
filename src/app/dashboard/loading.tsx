import { LoadingCard, LoadingRows } from '@/components/ui/LoadingBlock'

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <LoadingCard className="mb-6 h-[260px]" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingCard key={i} className="h-[140px]" />
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <LoadingCard className="h-[360px]" />
        <LoadingCard className="h-[360px]" />
      </div>
      <LoadingRows rows={4} />
    </div>
  )
}
