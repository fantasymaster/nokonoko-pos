'use client'

import { useMemo, useState, useEffect } from 'react'
import { usePOS } from '@/lib/pos-context'
import type { CompletedOrder } from '@/lib/pos-types'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function useTodayDate(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setNow(prev => prev.toDateString() !== d.toDateString() ? d : prev)
    }, 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function isWithinDays(date: Date, days: number, ref: Date) {
  const cutoff = new Date(ref)
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

function KPICard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex flex-col gap-1"
      style={{ backgroundColor: highlight ? BLUE : 'white' }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: highlight ? `rgba(242,237,228,0.7)` : `${BLUE}55` }}
      >
        {label}
      </p>
      <p
        className="text-xl sm:text-2xl font-black leading-tight"
        style={{ color: highlight ? CREAM : BLUE }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: highlight ? `rgba(242,237,228,0.6)` : `${BLUE}45` }}>
        {sub}
      </p>
    </div>
  )
}

function BarChart({
  bars,
  maxVal,
  todayIndex,
}: {
  bars: { label: string; value: number; sublabel?: string }[]
  maxVal: number
  todayIndex?: number
}) {
  return (
    <div className="flex items-end gap-1" style={{ height: 100 }}>
      {bars.map((bar, i) => {
        const pct = maxVal > 0 ? Math.max(3, (bar.value / maxVal) * 100) : 3
        const isToday = i === todayIndex
        return (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${pct}%`,
                backgroundColor: bar.value > 0 ? (isToday ? BLUE : `${BLUE}45`) : `${BLUE}10`,
              }}
            />
            <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: `${BLUE}55` }}>
              {bar.label}
            </span>
            {bar.value > 0 && (
              <span className="text-[7px] sm:text-[8px]" style={{ color: `${BLUE}40` }}>
                {bar.sublabel ?? bar.value}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const { orders } = usePOS()
  const now = useTodayDate()

  const todayOrders = useMemo(
    () => orders.filter(o => isSameDay(new Date(o.timestamp), now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, now.toDateString()]
  )
  const weekOrders = useMemo(
    () => orders.filter(o => isWithinDays(new Date(o.timestamp), 7, now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, now.toDateString()]
  )

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
  const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0)
  const avgOrder = weekOrders.length > 0 ? Math.round(weekRevenue / weekOrders.length) : 0

  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {}
    orders.forEach(o =>
      o.items.forEach(item => {
        if (!map[item.menuItemId]) map[item.menuItemId] = { name: item.displayName, qty: 0, revenue: 0 }
        map[item.menuItemId].qty += item.quantity
        map[item.menuItemId].revenue += item.price * item.quantity
      })
    )
    return Object.values(map).sort((a, b) => b.qty - a.qty)
  }, [orders])

  const dailyBars = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const label = d.toLocaleDateString('en-MY', { weekday: 'short' })
      const revenue = weekOrders
        .filter(o => isSameDay(new Date(o.timestamp), d))
        .reduce((s, o) => s + o.total, 0)
      return { label, value: revenue, sublabel: revenue > 0 ? `RM${revenue}` : undefined }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOrders, now.toDateString()])

  const sourceOrders: CompletedOrder[] = todayOrders.length > 0 ? todayOrders : weekOrders
  const hourlyBars = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const h = 8 + i
      const revenue = sourceOrders
        .filter(o => new Date(o.timestamp).getHours() === h)
        .reduce((s, o) => s + o.total, 0)
      const label = h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`
      return { label, value: revenue }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceOrders])

  const maxDaily = Math.max(...dailyBars.map(b => b.value), 1)
  const maxHourly = Math.max(...hourlyBars.map(b => b.value), 1)

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8" style={{ backgroundColor: CREAM }}>
      <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-6 sm:mb-7" style={{ color: BLUE }}>
        Analytics
      </h1>

      {/* KPI row — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
        <KPICard
          label="Today's Revenue"
          value={`RM${todayRevenue}`}
          sub={`${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''}`}
          highlight
        />
        <KPICard
          label="Week Revenue"
          value={`RM${weekRevenue}`}
          sub={`${weekOrders.length} orders`}
        />
        <KPICard
          label="Avg Order Value"
          value={`RM${avgOrder}`}
          sub="this week"
        />
        <KPICard
          label="Best Seller"
          value={topItems[0]?.name ?? '—'}
          sub={topItems[0] ? `${topItems[0].qty} sold` : 'no data'}
        />
      </div>

      {/* Charts — 1 col mobile, 2 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'white' }}>
          <p className="text-sm font-bold mb-4 sm:mb-5" style={{ color: BLUE }}>
            Daily Revenue — Last 7 Days
          </p>
          <BarChart bars={dailyBars} maxVal={maxDaily} todayIndex={6} />
        </div>

        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'white' }}>
          <p className="text-sm font-bold mb-4 sm:mb-5" style={{ color: BLUE }}>
            Peak Hours{todayOrders.length > 0 ? ' — Today' : ' — Last 7 Days'}
          </p>
          <BarChart bars={hourlyBars} maxVal={maxHourly} />
        </div>
      </div>

      {/* Top items */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'white' }}>
        <p className="text-sm font-bold mb-4 sm:mb-5" style={{ color: BLUE }}>Top Items (All Time)</p>
        <div className="space-y-4">
          {topItems.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3 sm:gap-4">
              <span className="text-sm font-black w-4 text-right shrink-0" style={{ color: `${BLUE}35` }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-bold truncate" style={{ color: BLUE }}>{item.name}</span>
                  <span className="text-sm font-black ml-3 shrink-0" style={{ color: BLUE }}>RM{item.revenue}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${BLUE}10` }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${topItems[0] ? (item.qty / topItems[0].qty) * 100 : 0}%`,
                      backgroundColor: i === 0 ? BLUE : `${BLUE}50`,
                    }}
                  />
                </div>
                <span className="text-[11px] mt-0.5 block" style={{ color: `${BLUE}45` }}>{item.qty} sold</span>
              </div>
            </div>
          ))}
          {topItems.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: `${BLUE}35` }}>No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
