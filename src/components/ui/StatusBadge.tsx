import type { POStatus } from '@/types'

const STYLES: Record<POStatus, string> = {
  'PO Created': 'border-[#BCD0E5] bg-[#EEF4FB] text-[#214A77]',
  Ordered: 'border-[#C8DCF2] bg-[#EFF6FD] text-[#225B93]',
  Shipped: 'border-[#F4D59B] bg-[#FFF7E8] text-[#8A5710]',
  Delivered: 'border-[#C9E1BE] bg-[#EFF8EA] text-[#335D16]',
  Received: 'border-[#BFE2D6] bg-[#ECFBF5] text-[#17624A]',
  'Asset Tagged': 'border-[#E8D8AA] bg-[#FDF8EC] text-[#72521A]',
  Closed: 'border-slate-200 bg-slate-100 text-slate-600',
}

export default function StatusBadge({ status }: { status: POStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] shadow-sm ${STYLES[status] || 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}
