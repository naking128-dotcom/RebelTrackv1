import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'RebelTrack — Ole Miss Athletics',
  description: 'Purchase Order & Inventory Management System for Ole Miss Athletics',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
            },
          }}
        />
      </body>
    </html>
  )
}
