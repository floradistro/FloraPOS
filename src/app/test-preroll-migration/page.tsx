'use client'

import { useState, useEffect } from 'react'
import { floraAPI, FloraProduct } from '@/lib/woocommerce'
import { generateMigrationData, VirtualPrerollProduct } from '@/lib/preroll-migration'
import { Package, ArrowRight, Check, X } from 'lucide-react'

export default function TestPrerollMigration() {
  const [products, setProducts] = useState<FloraProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [migrationData, setMigrationData] = useState<{
    virtualProducts: VirtualPrerollProduct[]
    skuMapping: Record<string, string>
    idMapping: Record<number, string>
  } | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const allProducts = await floraAPI.getProducts({ per_page: 100 })
      
      // Filter for flower products with pre-roll pricing
      const flowerProducts = allProducts.filter((p: FloraProduct) => 
        p.categories?.some((cat) => cat.slug === 'flower') && 
        p.preroll_pricing_tiers && 
        Object.keys(p.preroll_pricing_tiers).length > 0
      )
      
      setProducts(flowerProducts)
      
      // Generate migration preview
      const migration = generateMigrationData(flowerProducts)
      setMigrationData(migration)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-vscode-bg">
        <div className="text-vscode-text">Loading flower products...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vscode-bg text-vscode-text p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pre-roll Product Migration Preview</h1>
        
        <div className="bg-black/20 border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Migration Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-vscode-bgTertiary p-4 rounded">
              <div className="text-2xl font-bold text-green-400">{products.length}</div>
              <div className="text-sm text-vscode-textMuted">Flower Products with Pre-roll Pricing</div>
            </div>
            <div className="bg-vscode-bgTertiary p-4 rounded">
              <div className="text-2xl font-bold text-blue-400">{migrationData?.virtualProducts.length || 0}</div>
              <div className="text-sm text-vscode-textMuted">Virtual Pre-roll Products to Create</div>
            </div>
            <div className="bg-vscode-bgTertiary p-4 rounded">
              <div className="text-2xl font-bold text-orange-400">0.7g</div>
              <div className="text-sm text-vscode-textMuted">Default Conversion Rate</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {products.map((flower, index) => {
            const virtualProduct = migrationData?.virtualProducts[index]
            if (!virtualProduct) return null

            return (
              <div key={flower.id} className="bg-black/20 border border-white/10 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Current Flower Product */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-400">Current Flower Product</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Name:</span>
                        <span>{flower.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">SKU:</span>
                        <span>{flower.sku || `FLW-${flower.id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Stock:</span>
                        <span>{flower.stock_quantity}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Price/gram:</span>
                        <span>${flower.price}</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-vscode-textMuted mb-1">Pre-roll Pricing:</div>
                        <div className="flex gap-2">
                          {Object.entries(flower.preroll_pricing_tiers || {}).map(([count, price]) => (
                            <div key={count} className="bg-vscode-bgTertiary px-2 py-1 rounded text-sm">
                              {count}x: ${price}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-vscode-textMuted" />
                  </div>

                  {/* New Virtual Pre-roll Product */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-blue-400">New Virtual Pre-roll Product</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Name:</span>
                        <span>{virtualProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">SKU:</span>
                        <span>{virtualProduct.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Stock:</span>
                        <span className="text-orange-400">0 (virtual)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-vscode-textMuted">Base Price:</span>
                        <span>${virtualProduct.price}</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-vscode-textMuted mb-1">Metadata:</div>
                        <div className="space-y-1">
                          {virtualProduct.meta_data.slice(0, 4).map((meta, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-vscode-textMuted">{meta.key}:</span>
                              <span>{meta.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Calculation Example */}
                <div className="mt-6 bg-vscode-bgTertiary p-4 rounded">
                  <h4 className="text-sm font-semibold mb-2 text-vscode-textMuted">Inventory Calculation Example:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-vscode-textMuted">Flower Stock:</span>
                      <span className="ml-2">{flower.stock_quantity}g</span>
                    </div>
                    <div>
                      <span className="text-vscode-textMuted">Can Make:</span>
                      <span className="ml-2">{Math.floor(flower.stock_quantity / 0.7)} pre-rolls</span>
                    </div>
                    <div>
                      <span className="text-vscode-textMuted">Virtual Ready:</span>
                      <span className="ml-2">{flower.virtual_preroll_count || 0} pre-rolls</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Implementation Steps */}
        <div className="mt-12 bg-black/20 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Steps</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Create Virtual Products</h3>
                <p className="text-sm text-vscode-textMuted">Create separate pre-roll products with 0 stock and source_flower_id metadata</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Update Addify Plugin</h3>
                <p className="text-sm text-vscode-textMuted">Modify inventory deduction to check source_flower_id and deduct from linked flower</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Update Frontend Display</h3>
                <p className="text-sm text-vscode-textMuted">Show pre-rolls as separate products with calculated availability</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold">Cart & Order Processing</h3>
                <p className="text-sm text-vscode-textMuted">Handle virtual products in cart with proper tax and itemization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 