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

// ── Export helpers ─────────────────────────────────────────────────────────

function exportAnalyticsCSV(params: {
  now: Date
  todayRevenue: number
  todayCount: number
  weekRevenue: number
  weekCount: number
  avgOrder: number
  topItems: { name: string; qty: number; revenue: number }[]
  dailyBars: { label: string; value: number }[]
  hourlyBars: { label: string; value: number }[]
}) {
  const dateStr = params.now.toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })
  const rows: (string | number)[][] = [
    [`nokonoko™ Analytics — ${dateStr}`],
    [],
    ['SUMMARY'],
    ["Today's Revenue", `RM${params.todayRevenue}`, `${params.todayCount} orders`],
    ['Week Revenue', `RM${params.weekRevenue}`, `${params.weekCount} orders`],
    ['Avg Order Value', `RM${params.avgOrder}`],
    ['Best Seller', params.topItems[0]?.name ?? '—', params.topItems[0] ? `${params.topItems[0].qty} sold` : ''],
    [],
    ['DAILY REVENUE — LAST 7 DAYS'],
    ['Day', 'Revenue (RM)'],
    ...params.dailyBars.map(b => [b.label, b.value]),
    [],
    ['TOP ITEMS (ALL TIME)'],
    ['Rank', 'Item', 'Qty Sold', 'Revenue (RM)'],
    ...params.topItems.map((item, i) => [i + 1, item.name, item.qty, item.revenue]),
    [],
    ['PEAK HOURS'],
    ['Hour', 'Revenue (RM)'],
    ...params.hourlyBars.filter(b => b.value > 0).map(b => [b.label, b.value]),
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nokonoko-analytics-${params.now.toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportAnalyticsPDF(params: {
  now: Date
  todayRevenue: number
  todayCount: number
  weekRevenue: number
  weekCount: number
  avgOrder: number
  topItems: { name: string; qty: number; revenue: number }[]
  dailyBars: { label: string; value: number }[]
  hourlyBars: { label: string; value: number }[]
}) {
  const dateStr = params.now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const maxDaily = Math.max(...params.dailyBars.map(b => b.value), 1)
  const maxQty = params.topItems[0]?.qty ?? 1

  const dailyRows = params.dailyBars.map(b => `
    <tr>
      <td>${b.label}</td>
      <td style="text-align:right;font-weight:700">RM${b.value}</td>
      <td style="width:40%">
        <div style="background:#eee;border-radius:4px;height:8px">
          <div style="background:#1A28FF;border-radius:4px;height:8px;width:${b.value > 0 ? Math.max(4, (b.value / maxDaily) * 100) : 0}%"></div>
        </div>
      </td>
    </tr>`).join('')

  const topRows = params.topItems.slice(0, 8).map((item, i) => `
    <tr>
      <td style="color:#aaa;text-align:center">${i + 1}</td>
      <td style="font-weight:600">${item.name}</td>
      <td style="text-align:right">${item.qty}</td>
      <td style="text-align:right;font-weight:700">RM${item.revenue}</td>
      <td style="width:30%">
        <div style="background:#eee;border-radius:4px;height:8px">
          <div style="background:${i === 0 ? '#1A28FF' : '#8890ff'};border-radius:4px;height:8px;width:${Math.max(4, (item.qty / maxQty) * 100)}%"></div>
        </div>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>nokonoko Analytics</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0 }
      body { font-family: -apple-system, sans-serif; color: #1A28FF; padding: 40px; max-width: 720px; margin: 0 auto }
      h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.04em }
      h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8890ff; margin: 28px 0 12px }
      .date { font-size: 13px; color: #8890ff; margin-top: 4px; margin-bottom: 32px }
      .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px }
      .kpi { background: #f5f4ff; border-radius: 12px; padding: 14px }
      .kpi.hi { background: #1A28FF }
      .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8890ff }
      .kpi.hi .kpi-label { color: rgba(242,237,228,0.7) }
      .kpi-value { font-size: 20px; font-weight: 900; margin: 4px 0 2px }
      .kpi.hi .kpi-value { color: #F2EDE4 }
      .kpi-sub { font-size: 11px; color: #8890ff }
      .kpi.hi .kpi-sub { color: rgba(242,237,228,0.6) }
      table { width: 100%; border-collapse: collapse; font-size: 13px }
      td, th { padding: 8px 10px; border-bottom: 1px solid #eef }
      th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #8890ff }
      tr:last-child td { border-bottom: none }
      @media print { body { padding: 24px } }
    </style>
  </head><body>
    <h1>nokonoko™ Analytics</h1>
    <p class="date">${dateStr}</p>

    <h2>Summary</h2>
    <div class="kpis">
      <div class="kpi hi">
        <div class="kpi-label">Today's Revenue</div>
        <div class="kpi-value">RM${params.todayRevenue}</div>
        <div class="kpi-sub">${params.todayCount} order${params.todayCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Week Revenue</div>
        <div class="kpi-value">RM${params.weekRevenue}</div>
        <div class="kpi-sub">${params.weekCount} orders</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Avg Order Value</div>
        <div class="kpi-value">RM${params.avgOrder}</div>
        <div class="kpi-sub">this week</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Best Seller</div>
        <div class="kpi-value" style="font-size:14px">${params.topItems[0]?.name ?? '—'}</div>
        <div class="kpi-sub">${params.topItems[0] ? `${params.topItems[0].qty} sold` : 'no data'}</div>
      </div>
    </div>

    <h2>Daily Revenue — Last 7 Days</h2>
    <table><thead><tr><th>Day</th><th style="text-align:right">Revenue</th><th></th></tr></thead>
    <tbody>${dailyRows}</tbody></table>

    <h2>Top Items (All Time)</h2>
    <table><thead><tr><th>#</th><th>Item</th><th style="text-align:right">Sold</th><th style="text-align:right">Revenue</th><th></th></tr></thead>
    <tbody>${topRows}</tbody></table>

    <script>window.onload = () => { window.print() }</script>
  </body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ── Page ───────────────────────────────────────────────────────────────────

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

  const exportParams = {
    now,
    todayRevenue,
    todayCount: todayOrders.length,
    weekRevenue,
    weekCount: weekOrders.length,
    avgOrder,
    topItems,
    dailyBars,
    hourlyBars,
  }

  const hasData = orders.length > 0

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8" style={{ backgroundColor: CREAM }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-7">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]" style={{ color: BLUE }}>
          Analytics
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAnalyticsCSV(exportParams)}
            disabled={!hasData}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
            style={{ borderColor: `${BLUE}20`, color: BLUE, backgroundColor: 'white', minHeight: 44 }}
          >
            <span>↓</span><span>CSV</span>
          </button>
          <button
            onClick={() => exportAnalyticsPDF(exportParams)}
            disabled={!hasData}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
            style={{ backgroundColor: BLUE, color: 'white', minHeight: 44 }}
          >
            <span>↓</span><span>PDF</span>
          </button>
        </div>
      </div>

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
