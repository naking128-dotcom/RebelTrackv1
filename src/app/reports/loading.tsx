import { LoadingCard, LoadingRows } from '@/components/ui/LoadingBlock'

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <LoadingCard className="mb-6 h-[84px]" />
      <LoadingCard className="mb-4 h-[92px]" />
      <LoadingRows rows={6} />
    </div>
  )
}
