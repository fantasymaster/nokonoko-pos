'use client'

import { useState } from 'react'
import { usePOS } from '@/lib/pos-context'
import type { CompletedOrder } from '@/lib/pos-types'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function Receipt({ order, onClose }: { order: CompletedOrder; onClose: () => void }) {
  const date = new Date(order.timestamp)
  const dateStr = date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(26,40,255,0.12)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
        {/* Receipt header */}
        <div className="px-8 pt-8 pb-5 text-center border-b-2 border-dashed border-gray-100">
          <div className="text-2xl font-black tracking-[-0.04em] mb-1" style={{ color: BLUE }}>
            nokonoko™
          </div>
          <div className="text-[11px] text-gray-400 font-medium">{dateStr}</div>
          <div className="text-[11px] text-gray-400">{timeStr}</div>
        </div>

        {/* Order ID */}
        <div className="px-8 pt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: `${BLUE}50` }}>
            {order.id}
          </div>

          {/* Line items */}
          <div className="space-y-2.5 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-3">
                  <span className="font-semibold" style={{ color: '#1a1a1a' }}>{item.displayName}</span>
                  {item.temperature && (
                    <span className="ml-1 text-[11px] capitalize" style={{ color: '#999' }}>
                      ({item.temperature})
                    </span>
                  )}
                  <span className="text-[11px]" style={{ color: '#bbb' }}> × {item.quantity}</span>
                </div>
                <span className="font-bold shrink-0" style={{ color: '#1a1a1a' }}>
                  RM{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-dashed border-gray-100 pt-3 pb-2 flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}50` }}>
              Total
            </span>
            <span className="text-2xl font-black" style={{ color: BLUE }}>
              RM{order.total}
            </span>
          </div>

          <div className="text-center text-[11px] text-gray-300 py-3">
            Thank you! Come again.
          </div>
        </div>

        {/* CTA */}
        <div className="px-8 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: BLUE, color: CREAM }}
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POSPage() {
  const { menu, cart, addToCart, updateQty, clearCart, checkout, nextOrderNumber } = usePOS()
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null)

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  const [charging, setCharging] = useState(false)

  const handleCharge = async () => {
    setCharging(true)
    const order = await checkout()
    setCharging(false)
    if (order) setCompletedOrder(order)
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">

        {/* ── Menu Panel ─────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: CREAM }}>
          <div className="px-10 flex-1">
            {menu.map((item, i) => {
              const isOut = item.stock === 0
              const isLow = !isOut && item.stock <= item.lowStockThreshold
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between py-5 gap-6">
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="relative inline-block">
                        {item.modifier && (
                          <span
                            className="absolute -top-4 right-0 text-[13px] font-semibold leading-none"
                            style={{ color: BLUE }}
                          >
                            {item.modifier}
                          </span>
                        )}
                        <span
                          className="block text-[64px] leading-none font-black tracking-[-0.03em]"
                          style={{ color: BLUE, opacity: isOut ? 0.25 : 1 }}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm font-medium" style={{ color: BLUE }}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOut && <span className="text-xs font-bold text-red-500">Out of stock</span>}
                        {isLow && (
                          <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
                            Low stock — {item.stock} left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add buttons */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {item.hasTemperature ? (
                        <>
                          <span className="text-xs font-semibold" style={{ color: `${BLUE}70` }}>
                            Hot / Iced
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => addToCart(item, 'hot')}
                              disabled={isOut}
                              className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                              style={{ backgroundColor: BLUE, color: CREAM }}
                            >
                              Hot&nbsp;RM{item.hotPrice}
                            </button>
                            <button
                              onClick={() => addToCart(item, 'iced')}
                              disabled={isOut}
                              className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                              style={{ border: `2px solid ${BLUE}`, color: BLUE, backgroundColor: 'transparent' }}
                            >
                              Iced&nbsp;RM{item.icedPrice}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={isOut}
                          className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                          style={{ backgroundColor: BLUE, color: CREAM }}
                        >
                          RM{item.fixedPrice}
                        </button>
                      )}
                    </div>
                  </div>

                  {i < menu.length - 1 && (
                    <div style={{ height: 1, backgroundColor: `${BLUE}25` }} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="pb-8" />
        </div>

        {/* ── Order Panel ─────────────────────────────── */}
        <div
          className="flex w-[300px] shrink-0 flex-col border-l"
          style={{ backgroundColor: '#FAFAFA', borderColor: `${BLUE}15` }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b" style={{ borderColor: `${BLUE}15` }}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-black tracking-tight leading-none" style={{ color: BLUE }}>
                Order
              </h2>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${BLUE}40` }}>
                #{String(nextOrderNumber).padStart(4, '0')}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium" style={{ color: `${BLUE}55` }}>
              {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Empty'}
            </p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="mt-10 text-center">
                <p className="text-sm font-semibold" style={{ color: `${BLUE}35` }}>No items yet</p>
                <p className="mt-1 text-xs" style={{ color: `${BLUE}25` }}>Tap a drink to add</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.cartId} className="flex items-start gap-3">
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 pt-0.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.cartId, -1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black leading-none transition-all hover:opacity-60"
                        style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-black" style={{ color: BLUE }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.cartId, 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black leading-none transition-all hover:opacity-60"
                        style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight truncate" style={{ color: BLUE }}>
                        {item.displayName}
                      </p>
                      {item.temperature && (
                        <p className="text-xs font-medium capitalize" style={{ color: `${BLUE}55` }}>
                          {item.temperature}
                        </p>
                      )}
                    </div>

                    <span className="text-sm font-bold shrink-0" style={{ color: BLUE }}>
                      RM{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals + charge */}
          {cart.length > 0 && (
            <div className="px-6 py-5 border-t space-y-3" style={{ borderColor: `${BLUE}15` }}>
              {/* Subtotal row */}
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}50` }}>
                  Total
                </span>
                <span className="text-3xl font-black tracking-tight leading-none" style={{ color: BLUE }}>
                  RM{total}
                </span>
              </div>

              <button
                onClick={handleCharge}
                disabled={charging}
                className="w-full py-4 rounded-2xl text-base font-black tracking-tight transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: BLUE, color: CREAM }}
              >
                {charging ? 'Saving…' : `Charge  RM${total}`}
              </button>

              <button
                onClick={clearCart}
                className="w-full py-1.5 text-xs font-semibold transition-all hover:opacity-50"
                style={{ color: `${BLUE}45` }}
              >
                Clear order
              </button>
            </div>
          )}
        </div>
      </div>

      {completedOrder && (
        <Receipt order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </>
  )
}
