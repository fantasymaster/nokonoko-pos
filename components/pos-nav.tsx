'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { usePOS } from '@/lib/pos-context'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-xs sm:text-sm font-bold tabular-nums hidden sm:block shrink-0" style={{ color: `${BLUE}60` }}>
      {time}
    </span>
  )
}

export function POSNav() {
  const pathname = usePathname()
  const { menu } = usePOS()
  const lowStockCount = menu.filter(m => m.stock > 0 && m.stock <= m.lowStockThreshold).length
  const outCount = menu.filter(m => m.stock === 0).length
  const alertCount = lowStockCount + outCount

  const tabs = [
    { label: 'Order', href: '/pos' },
    { label: 'Analytics', href: '/pos/analytics' },
    { label: 'Inventory', href: '/pos/inventory', badge: alertCount || undefined },
    { label: 'History', href: '/pos/history' },
  ]

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-8 shrink-0 border-b gap-2"
      style={{ height: 56, borderColor: `${BLUE}18`, backgroundColor: CREAM }}
    >
      {/* Brand */}
      <div className="flex items-end gap-1 shrink-0">
        <span className="text-[17px] sm:text-[22px] font-black tracking-[-0.04em] leading-none" style={{ color: BLUE }}>
          nokonoko
        </span>
        <span className="text-[9px] sm:text-xs font-black leading-none mb-0.5" style={{ color: BLUE }}>™</span>
        <span
          className="ml-1 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full leading-none mb-1"
          style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
        >
          POS
        </span>
      </div>

      {/* Tabs — scrollable on mobile */}
      <nav
        className="flex gap-0.5 overflow-x-auto flex-1 justify-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {tabs.map(tab => {
          const active = tab.href === '/pos'
            ? pathname === '/pos'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
              style={{
                backgroundColor: active ? BLUE : 'transparent',
                color: active ? CREAM : `${BLUE}55`,
              }}
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ backgroundColor: '#EF4444', color: 'white' }}
                >
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <LiveClock />
    </header>
  )
}
