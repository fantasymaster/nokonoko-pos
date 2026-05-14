'use client'

import { POSProvider, usePOS } from '@/lib/pos-context'
import { POSNav } from '@/components/pos-nav'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function POSShell({ children }: { children: React.ReactNode }) {
  const { loading } = usePOS()
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: CREAM }}>
      <POSNav />
      <div className="flex-1 overflow-hidden relative">
        {children}
        {loading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ backgroundColor: `${CREAM}e0`, backdropFilter: 'blur(2px)' }}
          >
            <div
              className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${BLUE}30`, borderTopColor: BLUE }}
            />
            <p className="text-sm font-bold" style={{ color: BLUE }}>
              Loading…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <POSProvider>
      <POSShell>{children}</POSShell>
    </POSProvider>
  )
}
