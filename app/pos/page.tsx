'use client'

import { useState } from 'react'
import { usePOS } from '@/lib/pos-context'
import type { CompletedOrder } from '@/lib/pos-types'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function playAddSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.07)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => ctx.close()
  } catch {}
}

function playCheckoutSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const freqs = [523, 659, 784]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.08
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.35)
      if (i === freqs.length - 1) osc.onended = () => ctx.close()
    })
  } catch {}
}

function Receipt({ order, onClose, onCancel }: { order: CompletedOrder; onClose: () => void; onCancel: () => void }) {
  const date = new Date(order.timestamp)
  const dateStr = date.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(26,40,255,0.12)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="px-8 pt-8 pb-5 text-center border-b-2 border-dashed border-gray-100">
          <div className="text-2xl font-black tracking-[-0.04em] mb-1" style={{ color: BLUE }}>nokonoko™</div>
          <div className="text-[11px] text-gray-400 font-medium">{dateStr}</div>
          <div className="text-[11px] text-gray-400">{timeStr}</div>
        </div>
        <div className="px-8 pt-4">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}50` }}>
              {order.id}
            </div>
            {order.customerName && (
              <div className="text-sm font-black" style={{ color: BLUE }}>{order.customerName}</div>
            )}
          </div>
          <div className="space-y-2.5 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-3">
                  <span className="font-semibold" style={{ color: '#1a1a1a' }}>{item.displayName}</span>
                  {item.temperature && (
                    <span className="ml-1 text-[11px] capitalize" style={{ color: '#999' }}>({item.temperature})</span>
                  )}
                  <span className="text-[11px]" style={{ color: '#bbb' }}> × {item.quantity}</span>
                </div>
                <span className="font-bold shrink-0" style={{ color: '#1a1a1a' }}>RM{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-gray-100 pt-3 pb-2 flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}50` }}>Total</span>
            <span className="text-2xl font-black" style={{ color: BLUE }}>RM{order.total}</span>
          </div>
          <div className="text-center text-[11px] text-gray-300 py-3">Thank you! Come again.</div>
        </div>
        <div className="px-8 pb-8 space-y-2.5">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: BLUE, color: CREAM }}
          >
            New Order
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-sm font-bold tracking-tight transition-all hover:opacity-70 active:scale-[0.98]"
            style={{ color: '#EF4444', backgroundColor: 'transparent' }}
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderPanel({ onCharge, charging, onClose, customerName, onCustomerNameChange }: {
  onCharge: () => void
  charging: boolean
  onClose?: () => void
  customerName: string
  onCustomerNameChange: (name: string) => void
}) {
  const { cart, updateQty, clearCart, nextOrderNumber } = usePOS()
  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: `${BLUE}15` }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-black tracking-tight leading-none" style={{ color: BLUE }}>Order</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: `${BLUE}40` }}>
              #{String(nextOrderNumber).padStart(4, '0')}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-lg font-black transition-all hover:opacity-70 active:scale-95"
                style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
              >×</button>
            )}
          </div>
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQty(item.cartId, -1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black leading-none transition-all hover:opacity-60 active:scale-95"
                    style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                  >−</button>
                  <span className="w-6 text-center text-sm font-black" style={{ color: BLUE }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.cartId, 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black leading-none transition-all hover:opacity-60 active:scale-95"
                    style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                  >+</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight truncate" style={{ color: BLUE }}>{item.displayName}</p>
                  {item.temperature && (
                    <p className="text-xs font-medium capitalize" style={{ color: `${BLUE}55` }}>{item.temperature}</p>
                  )}
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: BLUE }}>RM{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer name */}
      <div className="px-6 pb-3 pt-4 border-t" style={{ borderColor: `${BLUE}15` }}>
        <input
          type="text"
          value={customerName}
          onChange={e => onCustomerNameChange(e.target.value)}
          placeholder="Customer name"
          className="w-full rounded-2xl text-base font-medium outline-none transition-all"
          style={{
            padding: '14px 16px',
            backgroundColor: `${BLUE}08`,
            color: BLUE,
            border: `1.5px solid ${customerName ? `${BLUE}40` : `${BLUE}15`}`,
          }}
        />
      </div>

      {/* Total + charge */}
      {cart.length > 0 && (
        <div className="px-6 py-5 border-t space-y-3" style={{ borderColor: `${BLUE}15` }}>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${BLUE}50` }}>Total</span>
            <span className="text-3xl font-black tracking-tight leading-none" style={{ color: BLUE }}>RM{total}</span>
          </div>
          <button
            onClick={onCharge}
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
  )
}

export default function POSPage() {
  const { menu, cart, addToCart, checkout, cancelOrder } = usePOS()
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null)
  const [charging, setCharging] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [customerName, setCustomerName] = useState('')

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  const handleCharge = async () => {
    setCharging(true)
    const order = await checkout(customerName || undefined)
    setCharging(false)
    if (order) {
      playCheckoutSound()
      setShowMobileCart(false)
      setCompletedOrder(order)
      setCustomerName('')
    }
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">

        {/* ── Menu Panel ─────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: CREAM }}>
          <div className="px-4 sm:px-10 flex-1">
            {menu.map((item, i) => {
              const isOut = item.stock === 0
              const isLow = !isOut && item.stock <= item.lowStockThreshold
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between py-4 sm:py-5 gap-3 sm:gap-6">
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="relative inline-block">
                        {item.modifier && (
                          <span
                            className="absolute -top-3 sm:-top-4 right-0 text-[11px] sm:text-[13px] font-semibold leading-none"
                            style={{ color: BLUE }}
                          >
                            {item.modifier}
                          </span>
                        )}
                        <span
                          className="block text-[38px] sm:text-[64px] leading-none font-black tracking-[-0.03em]"
                          style={{ color: BLUE, opacity: isOut ? 0.25 : 1 }}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-xs sm:text-sm font-medium" style={{ color: BLUE }}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOut && <span className="text-xs font-bold text-red-500">Out of stock</span>}
                        {isLow && (
                          <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
                            Low — {item.stock} left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add buttons */}
                    <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                      {item.hasTemperature ? (
                        <>
                          <span className="text-[10px] sm:text-xs font-semibold" style={{ color: `${BLUE}70` }}>
                            Hot / Iced
                          </span>
                          <div className="flex gap-1.5 sm:gap-2">
                            <button
                              onClick={() => { addToCart(item, 'hot'); playAddSound() }}
                              disabled={isOut}
                              className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                              style={{ backgroundColor: BLUE, color: CREAM, minHeight: 44 }}
                            >
                              Hot&nbsp;RM{item.hotPrice}
                            </button>
                            <button
                              onClick={() => { addToCart(item, 'iced'); playAddSound() }}
                              disabled={isOut}
                              className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                              style={{ border: `2px solid ${BLUE}`, color: BLUE, backgroundColor: 'transparent', minHeight: 44 }}
                            >
                              Iced&nbsp;RM{item.icedPrice}
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => { addToCart(item); playAddSound() }}
                          disabled={isOut}
                          className="mt-3 sm:mt-4 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                          style={{ backgroundColor: BLUE, color: CREAM, minHeight: 44 }}
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
          {/* Extra padding at bottom on mobile for sticky cart bar */}
          <div className={cart.length > 0 ? 'pb-24 md:pb-8' : 'pb-8'} />
        </div>

        {/* ── Desktop Order Panel ─────────────────────────────── */}
        <div className="hidden md:flex w-[300px] shrink-0 flex-col border-l" style={{ borderColor: `${BLUE}15` }}>
          <OrderPanel onCharge={handleCharge} charging={charging} customerName={customerName} onCustomerNameChange={setCustomerName} />
        </div>
      </div>

      {/* ── Mobile: sticky bottom cart bar ─────────────────────────────── */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 md:hidden"
          style={{ backgroundColor: CREAM, borderTop: `1px solid ${BLUE}15` }}
        >
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-between px-5 transition-all active:scale-[0.98]"
            style={{ backgroundColor: BLUE, color: CREAM }}
          >
            <span className="text-sm font-black">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            <span className="text-sm font-black">View Order · RM{total}</span>
          </button>
        </div>
      )}

      {/* ── Mobile: cart bottom sheet ─────────────────────────────── */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(26,40,255,0.12)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMobileCart(false)}
          />
          <div
            className="relative rounded-t-3xl overflow-hidden flex flex-col"
            style={{ backgroundColor: '#FAFAFA', maxHeight: '85vh' }}
          >
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: `${BLUE}20` }} />
            </div>
            <OrderPanel
              onCharge={handleCharge}
              charging={charging}
              onClose={() => setShowMobileCart(false)}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
            />
          </div>
        </div>
      )}

      {completedOrder && (
        <Receipt
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
          onCancel={async () => {
            await cancelOrder(completedOrder)
            setCompletedOrder(null)
          }}
        />
      )}
    </>
  )
}
