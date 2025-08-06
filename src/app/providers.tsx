'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { ReactNode, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

import { PERFORMANCE_CONFIG } from '@/config/performance'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_STALE_TIME, // 2 minutes
      gcTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_GC_TIME, // 5 minutes
      refetchOnWindowFocus: false,
      retry: PERFORMANCE_CONFIG.NETWORK.RETRY_COUNT,
      refetchOnReconnect: true,
      // Enable background refetching for better UX
      refetchInterval: false, // Disable automatic polling
      // Network mode for better offline handling
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
})

// Initialize default store if none exists
function initializeDefaultStore() {
  if (typeof window !== 'undefined') {
    const storedStore = localStorage.getItem('flora_pos_store')
    if (!storedStore) {
      // Set Charlotte Monroe as default store
      const defaultStore = {
        id: '30',
        name: 'Charlotte Monroe',
        address: '3033 Monroe Rd, Charlotte, NC 28205',
        location: {
          latitude: 35.2124,
          longitude: -80.7974
        }
      }
      localStorage.setItem('flora_pos_store', JSON.stringify(defaultStore))
      console.log('🏪 Set default store to Charlotte Monroe')
    }
  }
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeDefaultStore()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                borderRadius: '8px',
              },
            }}
          />
        </LocationProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 