'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { MenuItem, CartItem, CompletedOrder, Temperature, OrderItem } from './pos-types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'americano', name: 'Amecicano', category: 'coffee',
    hasTemperature: true, hotPrice: 8, icedPrice: 9,
    stock: 50, unit: 'cups', lowStockThreshold: 10,
  },
  {
    id: 'latte', name: 'Latte', category: 'coffee',
    hasTemperature: true, hotPrice: 12, icedPrice: 13,
    stock: 40, unit: 'cups', lowStockThreshold: 10,
  },
  {
    id: 'affogato', name: 'Affogato', description: 'Double espresso w/ ice cream', category: 'specialty',
    hasTemperature: false, fixedPrice: 15,
    stock: 20, unit: 'servings', lowStockThreshold: 5,
  },
  {
    id: 'matcha-latte', name: 'Matcha', modifier: 'Latte', category: 'matcha',
    hasTemperature: true, hotPrice: 13, icedPrice: 14,
    stock: 35, unit: 'cups', lowStockThreshold: 8,
  },
  {
    id: 'matcha-strawberry', name: 'Matcha', modifier: 'Strawberry', category: 'matcha',
    hasTemperature: true, hotPrice: 13, icedPrice: 14,
    stock: 30, unit: 'cups', lowStockThreshold: 8,
  },
]

interface POSContextType {
  menu: MenuItem[]
  cart: CartItem[]
  orders: CompletedOrder[]
  loading: boolean
  addToCart: (item: MenuItem, temp?: Temperature) => void
  updateQty: (cartId: string, delta: number) => void
  clearCart: () => void
  checkout: () => Promise<CompletedOrder | null>
  updateStock: (itemId: string, delta: number) => void
  nextOrderNumber: number
}

const POSContext = createContext<POSContextType | null>(null)

export function POSProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<CompletedOrder[]>([])
  const [nextOrderNumber, setNextOrderNumber] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadOrders(), loadStock()])
    setLoading(false)
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`id, order_number, subtotal, total, timestamp, order_items(menu_item_id, display_name, temperature, price, quantity)`)
      .order('timestamp', { ascending: false })

    if (error || !data) return

    const mapped: CompletedOrder[] = data.map((o: {
      id: string
      order_number: number
      subtotal: number
      total: number
      timestamp: string
      order_items: { menu_item_id: string; display_name: string; temperature: string | null; price: number; quantity: number }[]
    }) => ({
      id: o.id,
      orderNumber: o.order_number,
      subtotal: o.subtotal,
      total: o.total,
      timestamp: o.timestamp,
      items: o.order_items.map(i => ({
        menuItemId: i.menu_item_id,
        displayName: i.display_name,
        temperature: (i.temperature ?? undefined) as Temperature | undefined,
        price: i.price,
        quantity: i.quantity,
      })),
    }))

    setOrders(mapped)
    const maxNum = mapped.reduce((m, o) => Math.max(m, o.orderNumber), 0)
    setNextOrderNumber(maxNum + 1)
  }

  async function loadStock() {
    const { data } = await supabase.from('menu_items').select('id, stock')

    if (data && data.length > 0) {
      setMenu(prev => prev.map(item => {
        const row = data.find((r: { id: string; stock: number }) => r.id === item.id)
        return row ? { ...item, stock: row.stock } : item
      }))
    } else {
      // First boot — seed stock into Supabase
      await supabase.from('menu_items').insert(
        INITIAL_MENU.map(item => ({ id: item.id, stock: item.stock }))
      )
    }
  }

  const addToCart = useCallback((item: MenuItem, temp?: Temperature) => {
    const price = item.hasTemperature
      ? (temp === 'hot' ? item.hotPrice! : item.icedPrice!)
      : item.fixedPrice!
    const cartId = `${item.id}-${temp ?? 'fixed'}`
    const displayName = item.modifier ? `${item.name} ${item.modifier}` : item.name
    setCart(prev => {
      const existing = prev.find(c => c.cartId === cartId)
      if (existing) return prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { cartId, menuItemId: item.id, displayName, temperature: temp, price, quantity: 1 }]
    })
  }, [])

  const updateQty = useCallback((cartId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c)
          .filter(c => c.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const checkout = useCallback(async (): Promise<CompletedOrder | null> => {
    if (cart.length === 0) return null

    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0)
    const orderId = `N-${String(nextOrderNumber).padStart(4, '0')}`
    const timestamp = new Date().toISOString()

    // Insert order row
    const { error: orderErr } = await supabase.from('orders').insert({
      id: orderId,
      order_number: nextOrderNumber,
      subtotal: total,
      total,
      timestamp,
    })
    if (orderErr) { console.error('Order insert failed:', orderErr); return null }

    // Insert line items
    await supabase.from('order_items').insert(
      cart.map(c => ({
        order_id: orderId,
        menu_item_id: c.menuItemId,
        display_name: c.displayName,
        temperature: c.temperature ?? null,
        price: c.price,
        quantity: c.quantity,
      }))
    )

    // Decrement stock in Supabase
    for (const c of cart) {
      const item = menu.find(m => m.id === c.menuItemId)
      if (!item) continue
      await supabase
        .from('menu_items')
        .update({ stock: Math.max(0, item.stock - c.quantity) })
        .eq('id', c.menuItemId)
    }

    const order: CompletedOrder = {
      id: orderId,
      orderNumber: nextOrderNumber,
      items: cart.map(c => ({
        menuItemId: c.menuItemId,
        displayName: c.displayName,
        temperature: c.temperature,
        price: c.price,
        quantity: c.quantity,
      })),
      subtotal: total,
      total,
      timestamp,
    }

    // Optimistic local update
    setOrders(prev => [order, ...prev])
    setNextOrderNumber(n => n + 1)
    setMenu(prev => prev.map(item => {
      const used = cart.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0)
      return used > 0 ? { ...item, stock: Math.max(0, item.stock - used) } : item
    }))
    setCart([])
    return order
  }, [cart, nextOrderNumber, menu])

  const updateStock = useCallback(async (itemId: string, delta: number) => {
    const item = menu.find(m => m.id === itemId)
    if (!item) return
    const newStock = Math.max(0, item.stock + delta)
    setMenu(prev => prev.map(m => m.id === itemId ? { ...m, stock: newStock } : m))
    await supabase.from('menu_items').update({ stock: newStock }).eq('id', itemId)
  }, [menu])

  return (
    <POSContext.Provider value={{ menu, cart, orders, loading, addToCart, updateQty, clearCart, checkout, updateStock, nextOrderNumber }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error('usePOS must be used within POSProvider')
  return ctx
}
