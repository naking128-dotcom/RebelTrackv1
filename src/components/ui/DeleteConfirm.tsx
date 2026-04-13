'use client'
import { useState } from 'react'

interface Props {
  title: string
  message: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function DeleteConfirm({ title, message, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-red-600"
            style={{ width: 36, height: 36, background: '#fee2e2', fontSize: 16 }}
          >
            &#9888;
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
