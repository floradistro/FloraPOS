'use client'

import { useState, useEffect } from 'react'
import { createWooHeaders } from '@/lib/woocommerce'
import { useLocation } from '@/contexts/LocationContext'

const FLORA_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'

export default function PrerollDiagnosticsPage() {
  const { currentLocation } = useLocation()
  const [productId, setProductId] = useState('7851')
  const [prerollCount, setPrerollCount] = useState('5')
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // 1. Test Product Metadata
      console.log('1. Fetching product metadata...')
      const productResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${productId}`, {
        headers: createWooHeaders()
      })
      
      if (productResponse.ok) {
        const product = await productResponse.json()
        results.product = {
          success: true,
          name: product.name,
          sku: product.sku,
          stock: product.stock_quantity,
          metadata: product.meta_data?.filter((m: any) => 
            m.key.includes('preroll') || 
            m.key.includes('virtual') || 
            m.key === 'mli_preroll_conversion'
          )
        }
      } else {
        results.product = { success: false, error: 'Failed to fetch product' }
      }

      // 2. Test Addify Inventory API
      console.log('2. Testing Addify inventory endpoints...')
      
      // Get bulk inventory for location
      const bulkInventoryResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`, {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          product_ids: [parseInt(productId)],
          location_id: currentLocation?.id || '32'
        })
      })

      if (bulkInventoryResponse.ok) {
        const bulkData = await bulkInventoryResponse.json()
        results.bulkInventory = {
          success: true,
          data: bulkData
        }
      } else {
        results.bulkInventory = { success: false, error: 'Failed to fetch bulk inventory' }
      }

      // 3. Test Pre-roll Inventory Check
      console.log('3. Checking pre-roll inventory...')
      const inventoryResponse = await fetch(`${FLORA_API_URL}/wp-json/addify/v1/preroll/inventory/${productId}`, {
        headers: createWooHeaders()
      })

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        results.prerollInventory = {
          success: true,
          data: inventoryData
        }
      } else {
        results.prerollInventory = { 
          success: false, 
          error: 'Pre-roll inventory endpoint not found',
          note: 'This endpoint might not be registered in the plugin'
        }
      }

      // 4. Test Conversion Endpoint (without actually converting)
      console.log('4. Testing conversion endpoint availability...')
      const testConversionResponse = await fetch(`${FLORA_API_URL}/wp-json/addify/v1/preroll/convert`, {
        method: 'OPTIONS',
        headers: createWooHeaders()
      })

      results.conversionEndpoint = {
        available: testConversionResponse.ok || testConversionResponse.status === 405,
        status: testConversionResponse.status,
        note: 'Use POST method to actually convert'
      }

      // 5. Check available REST routes
      console.log('5. Checking available REST routes...')
      const routesResponse = await fetch(`${FLORA_API_URL}/wp-json/`, {
        headers: createWooHeaders()
      })

      if (routesResponse.ok) {
        const routes = await routesResponse.json()
        const addifyRoutes = Object.keys(routes.routes || {}).filter(r => 
          r.includes('addify') || r.includes('mli')
        )
        results.availableRoutes = {
          success: true,
          routes: addifyRoutes
        }
      }

    } catch (error) {
      console.error('Diagnostics error:', error)
      results.error = error instanceof Error ? error.message : 'Unknown error'
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const performConversion = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`${FLORA_API_URL}/wp-json/addify/v1/preroll/convert`, {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          product_id: parseInt(productId),
          preroll_count: parseInt(prerollCount),
          location_id: parseInt(currentLocation?.id || '32'),
          notes: 'Test conversion from diagnostics page'
        })
      })

      const result = await response.json()
      
      setDiagnostics((prev: any) => ({
        ...prev,
        conversionResult: {
          success: response.ok,
          status: response.status,
          data: result
        }
      }))
    } catch (error) {
      setDiagnostics((prev: any) => ({
        ...prev,
        conversionResult: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-vscode-bg p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-vscode-text mb-6">Pre-Roll Conversion Diagnostics</h1>
        
        <div className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-vscode-text mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-vscode-textMuted mb-1">Product ID</label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-vscode-bg text-vscode-text border border-white/[0.04] rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm text-vscode-textMuted mb-1">Pre-roll Count</label>
              <input
                type="text"
                value={prerollCount}
                onChange={(e) => setPrerollCount(e.target.value)}
                className="w-full px-3 py-2 bg-vscode-bg text-vscode-text border border-white/[0.04] rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm text-vscode-textMuted mb-1">Location</label>
              <div className="px-3 py-2 bg-vscode-bg text-vscode-text border border-white/[0.04] rounded">
                {currentLocation?.name || 'Not selected'} (ID: {currentLocation?.id})
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Diagnostics'}
            </button>
            
            <button
              onClick={performConversion}
              disabled={loading || !productId || !prerollCount}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Conversion
            </button>
          </div>
        </div>

        {Object.keys(diagnostics).length > 0 && (
          <div className="space-y-4">
            {/* Product Info */}
            {diagnostics.product && (
              <div className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-4">
                <h3 className="text-md font-semibold text-vscode-text mb-2">Product Information</h3>
                <pre className="text-xs text-vscode-textMuted overflow-auto">
                  {JSON.stringify(diagnostics.product, null, 2)}
                </pre>
              </div>
            )}

            {/* Bulk Inventory */}
            {diagnostics.bulkInventory && (
              <div className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-4">
                <h3 className="text-md font-semibold text-vscode-text mb-2">Location Inventory</h3>
                <pre className="text-xs text-vscode-textMuted overflow-auto">
                  {JSON.stringify(diagnostics.bulkInventory, null, 2)}
                </pre>
              </div>
            )}

            {/* Pre-roll Inventory */}
            {diagnostics.prerollInventory && (
              <div className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-4">
                <h3 className="text-md font-semibold text-vscode-text mb-2">Pre-roll Inventory Status</h3>
                <pre className="text-xs text-vscode-textMuted overflow-auto">
                  {JSON.stringify(diagnostics.prerollInventory, null, 2)}
                </pre>
              </div>
            )}

            {/* Conversion Result */}
            {diagnostics.conversionResult && (
              <div className={`border rounded-lg p-4 ${
                diagnostics.conversionResult.success 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <h3 className="text-md font-semibold text-vscode-text mb-2">Conversion Result</h3>
                <pre className="text-xs text-vscode-textMuted overflow-auto">
                  {JSON.stringify(diagnostics.conversionResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Available Routes */}
            {diagnostics.availableRoutes && (
              <div className="bg-vscode-bgSecondary border border-white/[0.04] rounded-lg p-4">
                <h3 className="text-md font-semibold text-vscode-text mb-2">Available Addify Routes</h3>
                <pre className="text-xs text-vscode-textMuted overflow-auto">
                  {JSON.stringify(diagnostics.availableRoutes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-vscode-bgTertiary border border-white/[0.04] rounded-lg p-4">
          <h3 className="text-md font-semibold text-vscode-text mb-2">API Endpoints Reference</h3>
          <div className="space-y-2 text-sm text-vscode-textMuted font-mono">
            <div>POST /wp-json/addify/v1/preroll/convert - Convert flower to pre-rolls</div>
            <div>GET /wp-json/addify/v1/preroll/inventory/:id - Check virtual inventory</div>
            <div>POST /wp-json/wc/v3/addify_headless_inventory/inventory/bulk - Get location inventory</div>
            <div>PUT /wp-json/wc/v3/addify_headless_inventory/stock/update - Update stock quantity</div>
            <div>POST /wp-json/wc/v3/addify_headless_inventory/products - Create inventory</div>
            <div>PUT /wp-json/wc/v3/addify_headless_inventory/products/:id/inventory/:inv_id - Update inventory</div>
          </div>
        </div>
      </div>
    </div>
  )
} 