'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { floraAPI, FloraProduct } from '../lib/woocommerce'
import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { findLinkedPrerollProducts, isVirtualPrerollProduct } from '../lib/virtual-product-helpers'
import Image from 'next/image'

interface ProductGridProps {
  category: number | null
  searchQuery: string
  onAddToCart: (product: FloraProduct) => void
  onProductCountChange?: (count: number) => void
  onLoadingChange?: (loading: boolean) => void
  isCustomerViewOpen?: boolean
  isListView?: boolean
}

export function ProductGrid({ category, searchQuery, onAddToCart, onProductCountChange, onLoadingChange, isCustomerViewOpen = false, isListView = false }: ProductGridProps) {
  const { store } = useAuth()
  const [globalSelectedProduct, setGlobalSelectedProduct] = useState<{ productId: number; variation: string } | null>(null)

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', category, searchQuery, store?.id],
    queryFn: async (): Promise<FloraProduct[]> => {
      const allProducts = await floraAPI.getProducts({
        category: category || undefined,
        search: searchQuery || undefined,
        storeId: store?.id,
        per_page: 100 // Increased to get all products including virtual ones
      })
      
      // Separate flower products and virtual products
      const flowerProducts = allProducts.filter(p => !isVirtualPrerollProduct(p))
      const virtualProducts = allProducts.filter(p => isVirtualPrerollProduct(p))
      
      // Enhance flower products with linked virtual products
      const enhancedProducts = flowerProducts.map(flower => {
        const linkedVirtual = findLinkedPrerollProducts(flower, allProducts)[0]
        return {
          ...flower,
          linkedPrerollProduct: linkedVirtual
        }
      })
      
      // Only return non-virtual products (flowers) for display
      return enhancedProducts
    },
    enabled: !!store?.id, // Only fetch when we have a store
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  })

  // Calculate filtered products for consistent hook usage
  const filteredProducts = products.filter((product: FloraProduct) => {
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             product.description.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Notify parent about product count changes (must be before any early returns)
  useEffect(() => {
    if (onProductCountChange) {
      onProductCountChange(filteredProducts.length)
    }
  }, [filteredProducts.length, onProductCountChange])

  // Notify parent about loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  if (!store?.id) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <p className="text-text-secondary">Please select a store to view products</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="absolute inset-x-0 top-0 -bottom-6 flex items-center justify-center bg-black">
        <Image
          src="/logo.png"
          alt="Loading"
          width={120}
          height={120}
          className="logo-fade-animation"
          priority
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <p className="text-red-400">Error loading products. Please try again.</p>
      </div>
    )
  }



  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12 bg-black min-h-full">
        <p className="text-text-secondary">
          {store.name ? `No products found at ${store.name}` : 'No products found'}
        </p>
        {store.name && (
          <p className="text-text-tertiary text-sm mt-1">
            Products shown are filtered by location inventory
          </p>
        )}
      </div>
    )
  }

  // Calculate grid columns based on screen size and customer view state
  const getGridCols = () => {
    if (isCustomerViewOpen) {
      return 2 // Always 2 columns when customer view is open
    } else {
      return 3 // Always 3 columns when customer view is closed
    }
  }

  return (
    <div className={`pb-8 min-h-full bg-neutral-800/20 ${
      isListView 
        ? 'flex flex-col gap-0' 
        : `grid grid-cols-1 sm:grid-cols-2 items-stretch ${
            isCustomerViewOpen 
              ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2' 
              : 'md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3'
          }`
    }`} style={{
      gap: isListView ? '0px' : '2px',
      backgroundColor: isListView ? 'transparent' : 'rgb(64 64 64 / 0.2)'
    }}>
      {filteredProducts.map((product: FloraProduct, index: number) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          globalSelectedProduct={globalSelectedProduct}
          setGlobalSelectedProduct={setGlobalSelectedProduct}
          isListView={isListView}
          index={index}
          gridCols={getGridCols()}
        />
      ))}
    </div>
  )
} 