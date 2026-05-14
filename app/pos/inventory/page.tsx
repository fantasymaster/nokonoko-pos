'use client'

import { useState } from 'react'
import { usePOS } from '@/lib/pos-context'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function statusFor(stock: number, threshold: number) {
  if (stock === 0) return { label: 'Out of stock', color: '#EF4444' }
  if (stock <= threshold) return { label: 'Low stock', color: '#F59E0B' }
  return { label: 'In stock', color: '#22C55E' }
}

export default function InventoryPage() {
  const { menu, updateStock } = usePOS()
  const [addInputs, setAddInputs] = useState<Record<string, string>>({})

  const outCount = menu.filter(m => m.stock === 0).length
  const lowCount = menu.filter(m => m.stock > 0 && m.stock <= m.lowStockThreshold).length

  const applyAdd = (id: string) => {
    const val = parseInt(addInputs[id] ?? '0', 10)
    if (val > 0) {
      updateStock(id, val)
      setAddInputs(prev => ({ ...prev, [id]: '' }))
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8" style={{ backgroundColor: CREAM }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <h1 className="text-4xl font-black tracking-[-0.03em]" style={{ color: BLUE }}>
          Inventory
        </h1>
        <div className="flex gap-3 text-sm font-semibold">
          {outCount > 0 && (
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
              {outCount} out of stock
            </span>
          )}
          {lowCount > 0 && (
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              {lowCount} low stock
            </span>
          )}
          {outCount === 0 && lowCount === 0 && (
            <span className="px-3 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
              All stocked
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {menu.map(item => {
          const displayName = item.modifier ? `${item.name} ${item.modifier}` : item.name
          const { label, color } = statusFor(item.stock, item.lowStockThreshold)
          const maxDisplay = item.lowStockThreshold * 6
          const barPct = Math.min(100, item.stock > 0 ? (item.stock / maxDisplay) * 100 : 0)

          return (
            <div key={item.id} className="rounded-2xl p-6 flex flex-col gap-4" style={{ backgroundColor: 'white' }}>
              {/* Title row */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl font-black tracking-tight leading-none"
                    style={{ color: BLUE }}
                  >
                    {displayName}
                  </h3>
                  <p className="text-xs mt-1 capitalize font-medium" style={{ color: `${BLUE}45` }}>
                    {item.category}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {label}
                </span>
              </div>

              {/* Stock count */}
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-5xl font-black leading-none"
                  style={{ color: item.stock === 0 ? '#EF4444' : BLUE }}
                >
                  {item.stock}
                </span>
                <span className="text-sm font-medium" style={{ color: `${BLUE}45` }}>
                  {item.unit}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${BLUE}10` }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                />
              </div>

              {/* Quick ±1 controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStock(item.id, -1)}
                  disabled={item.stock === 0}
                  className="w-9 h-9 rounded-full font-black text-base flex items-center justify-center transition-all hover:opacity-70 disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
                >
                  −
                </button>
                <button
                  onClick={() => updateStock(item.id, 1)}
                  className="w-9 h-9 rounded-full font-black text-base flex items-center justify-center transition-all hover:opacity-70"
                  style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
                >
                  +
                </button>

                {/* Bulk add */}
                <div className="flex flex-1 items-center gap-1.5 ml-1">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={addInputs[item.id] ?? ''}
                    onChange={e => setAddInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && applyAdd(item.id)}
                    className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm font-semibold border outline-none focus:ring-2"
                    style={{
                      borderColor: `${BLUE}20`,
                      color: BLUE,
                      backgroundColor: `${BLUE}04`,
                    }}
                  />
                  <button
                    onClick={() => applyAdd(item.id)}
                    className="px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80 active:scale-95 shrink-0"
                    style={{ backgroundColor: BLUE, color: CREAM }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Threshold note */}
              <p className="text-[10px] font-medium -mt-1" style={{ color: `${BLUE}35` }}>
                Alert below {item.lowStockThreshold} {item.unit}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
