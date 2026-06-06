'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { MenuItem, CartItem, CompletedOrder, Temperature, Category } from './pos-types'

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

interface PriceUpdate {
  hotPrice?: number
  icedPrice?: number
  fixedPrice?: number
}

interface POSContextType {
  menu: MenuItem[]
  cart: CartItem[]
  orders: CompletedOrder[]
  loading: boolean
  addToCart: (item: MenuItem, temp?: Temperature) => void
  updateQty: (cartId: string, delta: number) => void
  clearCart: () => void
  checkout: (customerName?: string) => Promise<CompletedOrder | null>
  cancelOrder: (order: CompletedOrder) => Promise<void>
  updateStock: (itemId: string, delta: number) => void
  updatePrice: (itemId: string, prices: PriceUpdate) => Promise<void>
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>
  updateMenuItem: (id: string, updates: Omit<MenuItem, 'id'>) => Promise<void>
  nextOrderNumber: number
}

const POSContext = createContext<POSContextType | null>(null)

// Extended row type returned after migration
type MenuRow = {
  id: string
  stock: number
  name?: string | null
  modifier?: string | null
  description?: string | null
  category?: string | null
  has_temperature?: boolean | null
  hot_price?: number | null
  iced_price?: number | null
  fixed_price?: number | null
  unit?: string | null
  low_stock_threshold?: number | null
  is_custom?: boolean | null
  sort_order?: number | null
}

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
    type OrderRow = {
      id: string
      order_number: number
      customer_name?: string | null
      subtotal: number
      total: number
      timestamp: string
      order_items: { menu_item_id: string; display_name: string; temperature: string | null; price: number; quantity: number }[]
    }

    // Try with customer_name first (post-migration)
    let rows: OrderRow[] | null = null
    let hasCustomerName = true

    const { data: d1, error: e1 } = await supabase
      .from('orders')
      .select(`id, order_number, customer_name, subtotal, total, timestamp, order_items(menu_item_id, display_name, temperature, price, quantity)`)
      .order('timestamp', { ascending: false })

    if (!e1) {
      rows = d1 as OrderRow[]
    } else {
      // Pre-migration fallback — customer_name column doesn't exist yet
      hasCustomerName = false
      const { data: d2, error: e2 } = await supabase
        .from('orders')
        .select(`id, order_number, subtotal, total, timestamp, order_items(menu_item_id, display_name, temperature, price, quantity)`)
        .order('timestamp', { ascending: false })
      if (e2 || !d2) return
      rows = d2 as OrderRow[]
    }

    if (!rows) return

    const mapped: CompletedOrder[] = rows.map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: hasCustomerName ? (o.customer_name ?? undefined) : undefined,
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
    // Try extended schema first (post-migration with price + custom item columns)
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, stock, name, modifier, description, category, has_temperature, hot_price, iced_price, fixed_price, unit, low_stock_threshold, is_custom, sort_order')

    if (error) {
      // Pre-migration fallback — columns don't exist yet, use basic stock only
      const { data: basic } = await supabase.from('menu_items').select('id, stock')
      if (basic && basic.length > 0) {
        setMenu(prev => prev.map(item => {
          const row = basic.find((r: { id: string; stock: number }) => r.id === item.id)
          return row ? { ...item, stock: row.stock } : item
        }))
      } else {
        await supabase.from('menu_items').insert(
          INITIAL_MENU.map(item => ({ id: item.id, stock: item.stock }))
        )
      }
      return
    }

    if (!data || data.length === 0) {
      // First boot after migration — seed with stock + sort order
      await supabase.from('menu_items').insert(
        INITIAL_MENU.map((item, i) => ({ id: item.id, stock: item.stock, sort_order: i }))
      )
      return
    }

    const rows = data as MenuRow[]

    setMenu(() => {
      // Update initial items with stock + optional price overrides from Supabase
      const updated = INITIAL_MENU.map(item => {
        const row = rows.find(r => r.id === item.id && !r.is_custom)
        if (!row) return item
        return {
          ...item,
          stock: row.stock,
          hotPrice: row.hot_price ?? item.hotPrice,
          icedPrice: row.iced_price ?? item.icedPrice,
          fixedPrice: row.fixed_price ?? item.fixedPrice,
        }
      })

      // Append custom items (sorted by sort_order)
      const custom: MenuItem[] = rows
        .filter(r => r.is_custom && r.name)
        .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
        .map(r => ({
          id: r.id,
          name: r.name!,
          modifier: r.modifier ?? undefined,
          description: r.description ?? undefined,
          category: (r.category ?? 'specialty') as Category,
          hasTemperature: r.has_temperature ?? false,
          hotPrice: r.hot_price ?? undefined,
          icedPrice: r.iced_price ?? undefined,
          fixedPrice: r.fixed_price ?? undefined,
          stock: r.stock,
          unit: r.unit ?? 'cups',
          lowStockThreshold: r.low_stock_threshold ?? 10,
        }))

      return [...updated, ...custom]
    })
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

  const checkout = useCallback(async (customerName?: string): Promise<CompletedOrder | null> => {
    if (cart.length === 0) return null

    const total = cart.reduce((s, c) => s + c.price * c.quantity, 0)
    const orderId = `N-${String(nextOrderNumber).padStart(4, '0')}`
    const timestamp = new Date().toISOString()

    // Capture snapshots before clearing state
    const cartSnapshot = [...cart]
    const menuSnapshot = [...menu]

    // ── Build order object ────────────────────────────────────────────────────
    const order: CompletedOrder = {
      id: orderId,
      orderNumber: nextOrderNumber,
      customerName: customerName || undefined,
      items: cartSnapshot.map(c => ({
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

    // ── Optimistic local update — receipt shows immediately ───────────────────
    setOrders(prev => [order, ...prev])
    setNextOrderNumber(n => n + 1)
    setMenu(prev => prev.map(item => {
      const used = cartSnapshot.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0)
      return used > 0 ? { ...item, stock: Math.max(0, item.stock - used) } : item
    }))
    setCart([])

    // ── Persist to Supabase in background (non-blocking) ─────────────────────
    ;(async () => {
      // Try insert with customer_name; fall back without it if column missing
      let { error: orderErr } = await supabase.from('orders').insert({
        id: orderId,
        order_number: order.orderNumber,
        customer_name: customerName || null,
        subtotal: total,
        total,
        timestamp,
      })
      if (orderErr) {
        const result = await supabase.from('orders').insert({
          id: orderId,
          order_number: order.orderNumber,
          subtotal: total,
          total,
          timestamp,
        })
        orderErr = result.error
        if (orderErr) { console.error('Order sync failed:', orderErr.message); return }
      }

      await supabase.from('order_items').insert(
        cartSnapshot.map(c => ({
          order_id: orderId,
          menu_item_id: c.menuItemId,
          display_name: c.displayName,
          temperature: c.temperature ?? null,
          price: c.price,
          quantity: c.quantity,
        }))
      )

      for (const c of cartSnapshot) {
        const item = menuSnapshot.find(m => m.id === c.menuItemId)
        if (!item) continue
        await supabase
          .from('menu_items')
          .update({ stock: Math.max(0, item.stock - c.quantity) })
          .eq('id', c.menuItemId)
      }
    })()

    return order
  }, [cart, nextOrderNumber, menu])

  const updateStock = useCallback(async (itemId: string, delta: number) => {
    const item = menu.find(m => m.id === itemId)
    if (!item) return
    const newStock = Math.max(0, item.stock + delta)
    setMenu(prev => prev.map(m => m.id === itemId ? { ...m, stock: newStock } : m))
    await supabase.from('menu_items').update({ stock: newStock }).eq('id', itemId)
  }, [menu])

  const updatePrice = useCallback(async (itemId: string, prices: PriceUpdate) => {
    setMenu(prev => prev.map(m => m.id === itemId ? { ...m, ...prices } : m))
    const update: Record<string, number> = {}
    if (prices.hotPrice !== undefined) update.hot_price = prices.hotPrice
    if (prices.icedPrice !== undefined) update.iced_price = prices.icedPrice
    if (prices.fixedPrice !== undefined) update.fixed_price = prices.fixedPrice
    if (Object.keys(update).length > 0) {
      await supabase.from('menu_items').update(update).eq('id', itemId)
    }
  }, [])

  const cancelOrder = useCallback(async (order: CompletedOrder) => {
    await supabase.from('orders').delete().eq('id', order.id)
    for (const item of order.items) {
      const menuItem = menu.find(m => m.id === item.menuItemId)
      if (!menuItem) continue
      const restoredStock = menuItem.stock + item.quantity
      setMenu(prev => prev.map(m => m.id === item.menuItemId ? { ...m, stock: restoredStock } : m))
      await supabase.from('menu_items').update({ stock: restoredStock }).eq('id', item.menuItemId)
    }
    setOrders(prev => prev.filter(o => o.id !== order.id))
  }, [menu])

  const updateMenuItem = useCallback(async (id: string, updates: Omit<MenuItem, 'id'>) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
    await supabase.from('menu_items').update({
      name: updates.name,
      modifier: updates.modifier ?? null,
      description: updates.description ?? null,
      category: updates.category,
      has_temperature: updates.hasTemperature,
      hot_price: updates.hotPrice ?? null,
      iced_price: updates.icedPrice ?? null,
      fixed_price: updates.fixedPrice ?? null,
      stock: updates.stock,
      unit: updates.unit,
      low_stock_threshold: updates.lowStockThreshold,
    }).eq('id', id)
  }, [])

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    const id = `custom-${Date.now()}`
    const full: MenuItem = { ...item, id }
    setMenu(prev => [...prev, full])
    await supabase.from('menu_items').insert({
      id,
      stock: full.stock,
      name: full.name,
      modifier: full.modifier ?? null,
      description: full.description ?? null,
      category: full.category,
      has_temperature: full.hasTemperature,
      hot_price: full.hotPrice ?? null,
      iced_price: full.icedPrice ?? null,
      fixed_price: full.fixedPrice ?? null,
      unit: full.unit,
      low_stock_threshold: full.lowStockThreshold,
      is_custom: true,
      sort_order: 100 + (menu.length - INITIAL_MENU.length),
    })
  }, [menu])

  return (
    <POSContext.Provider value={{
      menu, cart, orders, loading,
      addToCart, updateQty, clearCart, checkout, cancelOrder,
      updateStock, updatePrice, addMenuItem, updateMenuItem,
      nextOrderNumber,
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error('usePOS must be used within POSProvider')
  return ctx
}
