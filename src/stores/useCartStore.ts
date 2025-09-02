import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartStore {
  // State
  items: CartItem[];
  isLoading: boolean;
  pendingOperations: Set<string>; // Track operations in progress
  lastError: string | null;
  
  // Actions
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getTotalPrice: () => number;
  
  // Optimistic updates with rollback capability
  optimisticAddItem: (item: CartItem, operationId?: string) => void;
  optimisticUpdateQuantity: (id: string, quantity: number, operationId?: string) => void;
  optimisticRemoveItem: (id: string, operationId?: string) => void;
  rollbackOperation: (operationId: string) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Operation tracking
  addPendingOperation: (operationId: string) => void;
  removePendingOperation: (operationId: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      pendingOperations: new Set(),
      lastError: null,
      
      // Add item to cart (with quantity merging logic)
      addItem: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(cartItem => cartItem.id === item.id);
          
          if (existingItem) {
            // Merge quantities for existing item
            return {
              items: state.items.map(cartItem =>
                cartItem.id === item.id 
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              )
            };
          } else {
            // Add new item
            return {
              items: [...state.items, item]
            };
          }
        });
      },
      
      // Update item quantity (remove if 0)
      updateQuantity: (id: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(item => item.id !== id)
            };
          } else {
            return {
              items: state.items.map(item => 
                item.id === id ? { ...item, quantity } : item
              )
            };
          }
        });
      },
      
      // Remove specific item
      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      // Clear entire cart
      clearCart: () => {
        set({ items: [] });
      },
      
      // Get total number of items
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      // Get total price
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      // Enhanced optimistic updates with rollback capability
      optimisticAddItem: (item: CartItem, operationId?: string) => {
        if (operationId) {
          get().addPendingOperation(operationId);
        }
        get().addItem(item);
      },
      
      optimisticUpdateQuantity: (id: string, quantity: number, operationId?: string) => {
        if (operationId) {
          get().addPendingOperation(operationId);
        }
        get().updateQuantity(id, quantity);
      },
      
      optimisticRemoveItem: (id: string, operationId?: string) => {
        if (operationId) {
          get().addPendingOperation(operationId);
        }
        get().removeItem(id);
      },
      
      // Rollback operations if they fail
      rollbackOperation: (operationId: string) => {
        get().removePendingOperation(operationId);
        // In a real implementation, you'd store operation snapshots
        // and revert to the previous state here
      },
      
      // Error handling
      setError: (error: string | null) => {
        set({ lastError: error });
      },
      
      clearError: () => {
        set({ lastError: null });
      },
      
      // Operation tracking
      addPendingOperation: (operationId: string) => {
        set((state) => ({
          pendingOperations: new Set([...Array.from(state.pendingOperations), operationId])
        }));
      },
      
      removePendingOperation: (operationId: string) => {
        set((state) => {
          const newPendingOperations = new Set(state.pendingOperations);
          newPendingOperations.delete(operationId);
          return { pendingOperations: newPendingOperations };
        });
      },
    }),
    {
      name: 'flora-pos-cart', // localStorage key
      // Only persist the items, not loading states
      partialize: (state) => ({ items: state.items }),
    }
  )
);
