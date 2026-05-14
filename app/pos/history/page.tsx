'use client'

import { useState, useMemo } from 'react'
import { usePOS } from '@/lib/pos-context'
import type { CompletedOrder } from '@/lib/pos-types'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function dateLabel(date: Date): string {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  if (date.toDateString() === todayStr) return 'Today'
  if (date.toDateString() === yesterdayStr) return 'Yesterday'
  return date.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(orders: CompletedOrder[]): { label: string; orders: CompletedOrder[] }[] {
  const groups: { label: string; orders: CompletedOrder[] }[] = []
  for (const order of orders) {
    const label = dateLabel(new Date(order.timestamp))
    const existing = groups.find(g => g.label === label)
    if (existing) existing.orders.push(order)
    else groups.push({ label, orders: [order] })
  }
  return groups
}

export default function HistoryPage() {
  const { orders } = usePOS()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortDesc, setSortDesc] = useState(true)

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const sorted = [...orders]
      .sort((a, b) => {
        const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        return sortDesc ? diff : -diff
      })
      .filter(o =>
        q === '' ||
        o.id.toLowerCase().includes(q) ||
        o.items.some(i => i.displayName.toLowerCase().includes(q))
      )
    const groups = groupByDate(sorted)
    // Within each date group, show times latest → earliest
    groups.forEach(g =>
      g.orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    )
    return groups
  }, [orders, search, sortDesc])

  const totalFiltered = grouped.reduce((s, g) => s + g.orders.length, 0)

  return (
    <div className="h-full overflow-y-auto p-8" style={{ backgroundColor: CREAM }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.03em]" style={{ color: BLUE }}>
            Order History
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: `${BLUE}55` }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} · RM{totalRevenue} total revenue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortDesc(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-80"
            style={{ borderColor: `${BLUE}20`, color: BLUE, backgroundColor: 'white' }}
          >
            <span>{sortDesc ? '↓' : '↑'}</span>
            <span>{sortDesc ? 'Latest first' : 'Oldest first'}</span>
          </button>

          <input
            type="text"
            placeholder="Search order # or item…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 outline-none w-56 transition-all"
            style={{ borderColor: search ? BLUE : `${BLUE}20`, color: BLUE, backgroundColor: 'white' }}
          />
        </div>
      </div>

      {/* Empty state */}
      {totalFiltered === 0 && (
        <div className="text-center py-16">
          <p className="text-sm font-semibold" style={{ color: `${BLUE}35` }}>
            {search ? 'No orders match your search' : 'No orders yet'}
          </p>
        </div>
      )}

      {/* Date groups */}
      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.label}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: `${BLUE}50` }}>
                {group.label}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `${BLUE}15` }} />
              <span className="text-xs font-semibold" style={{ color: `${BLUE}35` }}>
                {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
                {' · '}
                RM{group.orders.reduce((s, o) => s + o.total, 0)}
              </span>
            </div>

            {/* Orders in this group */}
            <div className="space-y-2">
              {group.orders.map(order => {
                const date = new Date(order.timestamp)
                const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
                const isOpen = expanded === order.id
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: 'white' }}
                  >
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left transition-opacity hover:opacity-75"
                    >
                      {/* Time — most prominent date signal */}
                      <div className="shrink-0 text-center w-14">
                        <p className="text-base font-black leading-none tabular-nums" style={{ color: BLUE }}>
                          {timeStr}
                        </p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: `${BLUE}40` }}>
                          {order.id}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px self-stretch" style={{ backgroundColor: `${BLUE}10` }} />

                      {/* Items */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: BLUE }}>
                          {order.items.map(i =>
                            i.temperature ? `${i.displayName} (${i.temperature})` : i.displayName
                          ).join(' · ')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: `${BLUE}45` }}>
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Total + chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base font-black" style={{ color: BLUE }}>
                          RM{order.total}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{
                            color: `${BLUE}35`,
                            display: 'inline-block',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s',
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* Expanded receipt */}
                    {isOpen && (
                      <div className="px-6 pb-5 border-t" style={{ borderColor: `${BLUE}08` }}>
                        <div className="pt-4 space-y-2 mb-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start text-sm">
                              <div className="flex-1 pr-4">
                                <span className="font-semibold" style={{ color: BLUE }}>{item.displayName}</span>
                                {item.temperature && (
                                  <span className="ml-1 text-[11px] capitalize" style={{ color: `${BLUE}55` }}>
                                    ({item.temperature})
                                  </span>
                                )}
                                <span className="ml-1 text-[11px]" style={{ color: `${BLUE}40` }}>
                                  × {item.quantity}
                                </span>
                              </div>
                              <span className="font-bold shrink-0" style={{ color: BLUE }}>
                                RM{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          className="border-t pt-3 flex justify-between items-baseline"
                          style={{ borderColor: `${BLUE}10` }}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}45` }}>
                            Total
                          </span>
                          <span className="text-xl font-black" style={{ color: BLUE }}>
                            RM{order.total}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pb-8" />
    </div>
  )
}
