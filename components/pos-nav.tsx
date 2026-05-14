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
    <span className="text-sm font-bold tabular-nums" style={{ color: `${BLUE}60` }}>
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
    { label: 'Order History', href: '/pos/history' },
  ]

  return (
    <header
      className="flex items-center justify-between px-8 shrink-0 border-b"
      style={{ height: 64, borderColor: `${BLUE}18`, backgroundColor: CREAM }}
    >
      {/* Brand */}
      <div className="flex items-end gap-1">
        <span className="text-[22px] font-black tracking-[-0.04em] leading-none" style={{ color: BLUE }}>
          nokonoko
        </span>
        <span className="text-xs font-black leading-none mb-0.5" style={{ color: BLUE }}>™</span>
        <span
          className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full leading-none mb-1"
          style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
        >
          POS
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1">
        {tabs.map(tab => {
          const active = tab.href === '/pos'
            ? pathname === '/pos'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative px-4 py-2 text-sm font-bold rounded-lg transition-colors"
              style={{
                backgroundColor: active ? BLUE : 'transparent',
                color: active ? CREAM : `${BLUE}55`,
              }}
            >
              {tab.label}
              {tab.badge ? (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center"
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
