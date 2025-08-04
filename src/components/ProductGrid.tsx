'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, useMemo, useRef } from 'react'
import { floraAPI, FloraProduct } from '../lib/woocommerce'
import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { findLinkedPrerollProducts, isVirtualPrerollProduct } from '../lib/virtual-product-helpers'
import { setupTouchScrolling, unlockScroll } from '../utils/scrollUtils'
import Image from 'next/image'
import SiriGlowBorder from './SiriGlowBorder'

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
  const gridRef = useRef<HTMLDivElement>(null)

  // Get preloaded products from cache
  const { data: cachedProductsByCategory, isLoading, error } = useQuery<{
    all: FloraProduct[]
    [key: number]: FloraProduct[]
  }>({
    queryKey: ['all-products-preload', store?.id],
    enabled: false, // Don't refetch, just use cached data
    staleTime: Infinity, // Never consider stale
  })

  // Process products from cache
  const products = useMemo(() => {
    if (!cachedProductsByCategory) return []
    
    // Get products for the selected category or all products
    const categoryProducts = category 
      ? cachedProductsByCategory[category] || []
      : cachedProductsByCategory.all || []
    
    // Separate flower products and virtual products
    const flowerProducts = categoryProducts.filter((p: FloraProduct) => !isVirtualPrerollProduct(p))
    
    // Enhance flower products with linked virtual products
    const enhancedProducts = flowerProducts.map((flower: FloraProduct) => {
      const linkedVirtual = findLinkedPrerollProducts(flower, categoryProducts)[0]
      return {
        ...flower,
        linkedPrerollProduct: linkedVirtual
      }
    })
    
    // Only return non-virtual products (flowers) for display
    return enhancedProducts
  }, [cachedProductsByCategory, category])

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

  // Check if data is available (no loading since we use cached data)
  const isDataAvailable = !!cachedProductsByCategory

  // Notify parent about loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(!isDataAvailable)
    }
  }, [isDataAvailable, onLoadingChange])

  // Setup iPad scroll handling
  useEffect(() => {
    const gridElement = gridRef.current
    if (!gridElement) return

    // Setup touch scrolling for iPad
    const cleanup = setupTouchScrolling(gridElement)
    
    // Initial scroll unlock
    unlockScroll(gridElement)
    
    return cleanup
  }, [])

  if (!store?.id) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <p className="text-text-secondary">Please select a store to view products</p>
      </div>
    )
  }

  if (!isDataAvailable) {
    return (
      <>
        <SiriGlowBorder isLoading={true} />
        <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="Loading"
              width={120}
              height={120}
              className="logo-fade-animation mx-auto mb-6"
              priority
            />
            <h2 className="flora-distro-text text-animated">Flora Distro</h2>
            <p className="text-text-secondary mt-2">Loading products...</p>
          </div>
        </div>
      </>
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
          {store?.name ? `No products found at ${store.name}` : 'No products found'}
        </p>
        {store?.name && (
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
    <div 
      ref={gridRef}
      className={`scrollable-container ${
        isListView 
          ? 'overflow-y-auto h-full' 
          : `h-full grid grid-cols-1 sm:grid-cols-2 items-stretch ${
              isCustomerViewOpen 
                ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2' 
                : 'md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3'
            }`
      }`} style={{
        gap: isListView ? '0px' : '2px',
        backgroundColor: isListView ? 'transparent' : 'rgb(64 64 64 / 0.2)'
      }}>
      {isListView ? (
        <div className="min-h-full p-2">
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
      ) : (
        filteredProducts.map((product: FloraProduct, index: number) => (
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
        ))
      )}
    </div>
  )
} 