import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import useTelegram from '../hooks/useTelegram'

export interface CartItem {
  product_id: number
  title: string
  price_cents: number
  quantity: number
  body_zone?: string
  notes?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useTelegram()

  // Загружаем корзину из localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`cart_${user.id}`)
      if (saved) {
        try {
          setItems(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load cart:', e)
        }
      }
    }
  }, [user?.id])

  // Сохраняем корзину в localStorage
  useEffect(() => {
    if (user?.id && items.length >= 0) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(items))
    }
  }, [items, user?.id])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}





