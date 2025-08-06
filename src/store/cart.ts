import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FloraProduct } from '@/lib/woocommerce'
import { cartStorage } from '@/lib/secure-storage'

export interface CartItem {
  product: FloraProduct
  quantity: number
  variation?: {
    id: number
    attributes: Record<string, string>
  }
}

interface CartStore {
  items: CartItem[]
  addItem: (product: FloraProduct, quantity?: number, variation?: CartItem['variation']) => void
  removeItem: (productId: number, variationId?: number) => void
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1, variation) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.variation?.id === variation?.id
          )

          if (existingItemIndex >= 0) {
            const newItems = [...state.items]
            newItems[existingItemIndex].quantity += quantity
            return { items: newItems }
          }

          return {
            items: [...state.items, { product, quantity, variation }],
          }
        })
      },

      removeItem: (productId, variationId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId && item.variation?.id === variationId)
          ),
        }))
      },

      updateQuantity: (productId, quantity, variationId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variation?.id === variationId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const items = get().items
        return items.reduce((total, item) => {
          const price = parseFloat(item.product.sale_price || item.product.price)
          return total + price * item.quantity
        }, 0)
      },

      getItemCount: () => {
        const items = get().items
        return items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'pos-cart',
      storage: {
        getItem: (name: string) => {
          const data = cartStorage.getCart()
          return data ? JSON.stringify({ state: data }) : null
        },
        setItem: (name: string, value: string) => {
          try {
            const parsed = JSON.parse(value)
            cartStorage.setCart(parsed.state, 24 * 60 * 60 * 1000) // 24 hours
          } catch (error) {
            console.error('Failed to save cart to encrypted storage:', error)
          }
        },
        removeItem: (name: string) => {
          cartStorage.removeCart()
        }
      }
    }
  )
) 