'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import SiriGlowBorder from '../components/SiriGlowBorder'
import { useQuery } from '@tanstack/react-query'
import { floraAPI } from '../lib/woocommerce'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { isAuthenticated, isLoading: authLoading, store } = useAuth()
  const [isAppReady, setIsAppReady] = useState(false)

  // Preload ALL products for ALL categories
  const { isLoading: productsLoading } = useQuery({
    queryKey: ['all-products-preload', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      
      // Fetch products for all categories in parallel
      const categoryIds = [25, 19, 21, 22, 16] // Flower, Vapes, Edibles, Concentrates, Moonwater
      
      const allProductPromises = [
        // Get all products without category filter
        floraAPI.getProducts({
          storeId: store.id,
          per_page: 100
        }),
        // Get products for each specific category to ensure we have everything
        ...categoryIds.map(categoryId => 
          floraAPI.getProducts({
            storeId: store.id,
            category: categoryId,
            per_page: 100
          })
        )
      ]
      
      const results = await Promise.all(allProductPromises)
      
      // Combine and deduplicate all products
      const allProducts = results.flat()
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      )
      
      // Cache products by category for instant filtering
      const productsByCategory = {
        all: uniqueProducts,
        25: uniqueProducts.filter(p => p.categories?.some(cat => cat.id === 25)),
        19: uniqueProducts.filter(p => p.categories?.some(cat => cat.id === 19)),
        21: uniqueProducts.filter(p => p.categories?.some(cat => cat.id === 21)),
        22: uniqueProducts.filter(p => p.categories?.some(cat => cat.id === 22)),
        16: uniqueProducts.filter(p => p.categories?.some(cat => cat.id === 16))
      }
      
      return productsByCategory
    },
    enabled: !!store?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  const { isLoading: customersLoading } = useQuery({
    queryKey: ['customers-preload'],
    queryFn: async () => {
      return floraAPI.getCustomers({
        per_page: 50
      })
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  const { isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-preload'],
    queryFn: async () => {
      const params = new URLSearchParams({
        store_id: 'Charlotte Monroe',
        per_page: '50',
        orderby: 'date',
        order: 'desc'
      })
      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        return response.json()
      }
      throw new Error('Failed to fetch orders')
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  // Determine if app is fully loaded
  const isGlobalLoading = authLoading || (isAuthenticated && (productsLoading || customersLoading || ordersLoading))

  // Add a minimum loading time to prevent flash
  useEffect(() => {
    if (!isGlobalLoading && !isAppReady) {
      const timer = setTimeout(() => {
        setIsAppReady(true)
      }, 1500) // Minimum 1.5s loading time
      return () => clearTimeout(timer)
    }
  }, [isGlobalLoading, isAppReady])

  if (isGlobalLoading || !isAppReady) {
    return (
      <>
        <SiriGlowBorder isLoading={true} />
        <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="Flora Distro"
              width={120}
              height={120}
              className="logo-fade-animation mx-auto mb-6"
              priority
            />
            <h2 className="flora-distro-text text-animated">Flora Distro</h2>
            <p className="text-text-secondary mt-2">Loading your workspace...</p>
          </div>
        </div>
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <div>
        <LoginForm />
      </div>
    )  
  }

  return (
    <div>
      {children}
    </div>
  )
} 