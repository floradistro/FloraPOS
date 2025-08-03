'use client'

import { useState, useEffect } from 'react'
import { floraAPI, FloraProduct } from '@/lib/woocommerce'
import { ProductCard } from '@/components/ProductCard'

export default function TestVirtualPrerollsPage() {
  const [products, setProducts] = useState<FloraProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<{ productId: number; variation: string } | null>(null)

  useEffect(() => {
    loadFlowerProducts()
  }, [])

  const loadFlowerProducts = async () => {
    try {
      setLoading(true)
      // Load flower category products (category 25)
      const allProducts = await floraAPI.getProducts({ category: 25 })
      
      // For testing, let's simulate some virtual pre-roll data
      const productsWithVirtual = allProducts.map((product, index) => ({
        ...product,
        // Simulate different virtual pre-roll scenarios
        virtual_preroll_count: index === 0 ? 15 : index === 1 ? 5 : index === 2 ? 0 : 3,
        preroll_target: 10,
        total_prerolls_converted: index * 20,
        total_prerolls_sold: index * 15,
      }))
      
      setProducts(productsWithVirtual)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: FloraProduct, variation?: string) => {
    console.log('Add to cart:', product.name, variation)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vscode-bg text-white flex items-center justify-center">
        <div className="text-xl">Loading flower products...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vscode-bg text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Virtual Pre-Roll Test</h1>
        
        <div className="mb-8 bg-vscode-bgSecondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <ul className="space-y-2 text-sm text-vscode-textMuted">
            <li>• First product: 15 virtual pre-rolls (above target) - Should show green status</li>
            <li>• Second product: 5 virtual pre-rolls (below target) - Should show yellow/orange status</li>
            <li>• Third product: 0 virtual pre-rolls - Should show red status with conversion button</li>
            <li>• Other products: 3 virtual pre-rolls - Should show orange status</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.slice(0, 6).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              globalSelectedProduct={selectedProduct}
              setGlobalSelectedProduct={setSelectedProduct}
              isListView={false}
              index={0}
              gridCols={3}
            />
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">List View</h2>
          <div className="space-y-2">
            {products.slice(0, 3).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                globalSelectedProduct={selectedProduct}
                setGlobalSelectedProduct={setSelectedProduct}
                isListView={true}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 