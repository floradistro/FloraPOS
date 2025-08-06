'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { floraAPI, FloraProduct } from '../lib/woocommerce'
import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { findLinkedPrerollProducts, isVirtualPrerollProduct } from '../lib/virtual-product-helpers'
import { setupTouchScrolling, unlockScroll } from '../utils/scrollUtils'
import Image from 'next/image'
import SiriGlowBorder from './SiriGlowBorder'
import { CacheKeyManager } from '@/lib/cache-manager'
import { PERFORMANCE_CONFIG } from '@/config/performance'
import { usePaginatedData } from '../hooks/usePaginatedData'

interface PaginatedProductGridProps {
  category: number | null
  searchQuery: string
  onAddToCart: (product: FloraProduct) => void
  onProductCountChange?: (count: number) => void
  onLoadingChange?: (loading: boolean) => void
  isCustomerViewOpen?: boolean
  isListView?: boolean
}

export function PaginatedProductGrid({ 
  category, 
  searchQuery, 
  onAddToCart, 
  onProductCountChange, 
  onLoadingChange, 
  isCustomerViewOpen = false, 
  isListView = false 
}: PaginatedProductGridProps) {
  const { store } = useAuth()
  const [globalSelectedProduct, setGlobalSelectedProduct] = useState<{ productId: number; variation: string } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch function for paginated products
  const fetchProducts = useCallback(async (page: number, pageSize: number) => {
    if (!store?.id) {
      return { items: [], total: 0, hasMore: false }
    }

    const result = await floraAPI.getProductsComprehensive({
      storeId: store.id,
      category: category?.toString(),
      search: searchQuery || undefined,
      per_page: pageSize,
      page,
      stock_status: 'in_stock'
    })

    // Process products to filter virtual prerolls and enhance with linked products
    const flowerProducts = result.products.filter((p: FloraProduct) => !isVirtualPrerollProduct(p))
    
    const enhancedProducts = flowerProducts.map((flower: FloraProduct) => {
      const linkedVirtual = findLinkedPrerollProducts(flower, result.products)[0]
      return {
        ...flower,
        linkedPrerollProduct: linkedVirtual
      }
    })

    return {
      items: enhancedProducts,
      total: result.total,
      hasMore: result.hasMore
    }
  }, [store?.id, category, searchQuery])

  // Use paginated data hook with optimized cache keys
  const {
    items: products,
    hasNextPage,
    isFetching,
    isLoading,
    loadMore,
    refetch,
    totalItems,
    error
  } = usePaginatedData(
    CacheKeyManager.products(store?.id, category || undefined, { search: searchQuery }),
    fetchProducts,
    {
      pageSize: PERFORMANCE_CONFIG.PAGINATION.PRODUCTS_PER_PAGE,
      enabled: !!store?.id,
      staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_STALE_TIME,
      gcTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_GC_TIME
    }
  )

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    
    return products.filter((product: FloraProduct) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  // Notify parent about product count changes
  useEffect(() => {
    if (onProductCountChange) {
      onProductCountChange(totalItems)
    }
  }, [totalItems, onProductCountChange])

  // Notify parent about loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  // Setup iPad scroll handling
  useEffect(() => {
    const gridElement = gridRef.current
    if (!gridElement) return

    const cleanup = setupTouchScrolling(gridElement)
    unlockScroll(gridElement)
    
    return cleanup
  }, [])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.unobserve(loadMoreElement)
    }
  }, [hasNextPage, isFetching, loadMore])

  // Refetch when dependencies change
  useEffect(() => {
    refetch()
  }, [category, searchQuery, store?.id, refetch])

  if (!store?.id) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <p className="text-text-secondary">Please select a store to view products</p>
      </div>
    )
  }

  if (isLoading) {
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
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading products</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (filteredProducts.length === 0 && !isLoading) {
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
      }`} 
      style={{
        gap: isListView ? '0px' : '2px',
        backgroundColor: isListView ? 'transparent' : 'rgb(64 64 64 / 0.2)'
      }}
    >
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
          
          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isFetching ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more products...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  Load More Products
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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
          
          {/* Load More Trigger for Grid View */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="col-span-full flex justify-center py-8">
              {isFetching ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}