'use client'

import { useState, useEffect } from 'react'
import { createWooHeaders } from '@/lib/woocommerce'
import { VirtualPrerollSection } from '@/components/VirtualPrerollSection'
import { useLocation } from '@/contexts/LocationContext'
import { FloraProduct } from '@/lib/woocommerce'

const FLORA_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'

export default function TestFlowerPrerollsPage() {
  const { currentLocation } = useLocation()
  const [flowerProducts, setFlowerProducts] = useState<FloraProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<FloraProduct | null>(null)

  // Fetch flower products
  useEffect(() => {
    async function fetchFlowerProducts() {
      try {
        const response = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products?category=9&per_page=50`, {
          headers: createWooHeaders()
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const products = await response.json()
        
        // Filter for flower products with conversion capability
        const flowerProductsWithConversion = products.filter((p: FloraProduct) => {
          const hasConversionRate = p.meta_data?.some((meta: any) => 
            meta.key === 'mli_preroll_conversion' && parseFloat(meta.value) > 0
          )
          return hasConversionRate
        })
        
        // Enrich products with parsed metadata
        const enrichedProducts = flowerProductsWithConversion.map((p: FloraProduct) => {
          const metaData = p.meta_data || []
          const conversionRate = metaData.find((m: any) => m.key === 'mli_preroll_conversion')?.value || 0.7
          const virtualCount = metaData.find((m: any) => m.key === '_virtual_preroll_count')?.value || 0
          
          return {
            ...p,
            mli_preroll_conversion: parseFloat(conversionRate),
            virtual_preroll_count: parseInt(virtualCount)
          }
        })
        
        setFlowerProducts(enrichedProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFlowerProducts()
  }, [])

  const handleConvert = async (productId: number, count: number) => {
    try {
      const response = await fetch('/api/virtual-prerolls/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          preroll_count: count,
          location_id: currentLocation?.id,
          notes: 'Test conversion from flower test page'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Success! ${result.message}`)
        // Refresh the product list
        window.location.reload()
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Conversion error:', error)
      alert('Failed to convert pre-rolls')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-vscode-bg p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-vscode-text mb-4">Loading flower products...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vscode-bg p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-vscode-text mb-4">Flower Pre-Roll Management Test</h1>
        
        <div className="mb-4 text-sm text-vscode-textMuted">
          Current Location: {currentLocation?.name || 'Not selected'}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flowerProducts.map((product) => (
            <div key={product.id} className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-vscode-text mb-2">{product.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm text-vscode-textMuted">
                  Stock: {product.stock_quantity}g
                </div>
                <div className="text-sm text-vscode-textMuted">
                  Conversion Rate: {product.mli_preroll_conversion}g per pre-roll
                </div>
                <div className="text-sm text-vscode-textMuted">
                  SKU: {product.sku || 'N/A'}
                </div>
              </div>
              
              <VirtualPrerollSection
                product={product}
                onConvert={async (count) => {
                  await handleConvert(product.id, count)
                }}
                onConversionSuccess={() => {
                  console.log('Conversion successful!')
                }}
              />
            </div>
          ))}
        </div>
        
        {flowerProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-vscode-textMuted">No flower products with pre-roll conversion capability found.</p>
          </div>
        )}
      </div>
    </div>
  )
} 