export type Temperature = 'hot' | 'iced'
export type Category = 'coffee' | 'matcha' | 'specialty'

export interface MenuItem {
  id: string
  name: string
  modifier?: string
  description?: string
  category: Category
  hasTemperature: boolean
  hotPrice?: number
  icedPrice?: number
  fixedPrice?: number
  stock: number
  unit: string
  lowStockThreshold: number
}

export interface CartItem {
  cartId: string
  menuItemId: string
  displayName: string
  temperature?: Temperature
  price: number
  quantity: number
}

export interface OrderItem {
  menuItemId: string
  displayName: string
  temperature?: Temperature
  price: number
  quantity: number
}

export interface CompletedOrder {
  id: string
  orderNumber: number
  customerName?: string
  items: OrderItem[]
  subtotal: number
  total: number
  timestamp: string
}
