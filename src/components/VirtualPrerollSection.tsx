'use client'

import { useState, useEffect } from 'react'
import { FloraProduct } from '../lib/woocommerce'
import { useLocation } from '../contexts/LocationContext'
import { Loader2, Package, AlertCircle, Plus, Minus } from 'lucide-react'
import { useVirtualPrerolls } from '../hooks/useVirtualPrerolls'

interface VirtualPrerollSectionProps {
  product: FloraProduct
  linkedPrerollProduct?: FloraProduct
  onConvert?: (count: number) => Promise<void>
  onConversionSuccess?: () => void
}

export function VirtualPrerollSection({ 
  product, 
  linkedPrerollProduct, 
  onConvert, 
  onConversionSuccess 
}: VirtualPrerollSectionProps) {
  const { currentLocation } = useLocation()
  const { checkVirtualInventory } = useVirtualPrerolls()
  const [isConverting, setIsConverting] = useState(false)
  const [prerollCount, setPrerollCount] = useState(1)
  const [showConversionUI, setShowConversionUI] = useState(false)
  const [inventoryInfo, setInventoryInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Check if this is a float product
  const isFloatProduct = product.meta_data?.some(m => m.key === 'mli_is_float_product' && m.value === 'yes')
  const hasConversionRate = product.mli_preroll_conversion && product.mli_preroll_conversion > 0
  const conversionRate = product.mli_preroll_conversion || 0.7

  // Fetch inventory info
  useEffect(() => {
    if (isFloatProduct && product.id) {
      setLoading(true)
      checkVirtualInventory(product.id, currentLocation?.id)
        .then(data => {
          setInventoryInfo(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [product.id, currentLocation?.id, isFloatProduct])

  if (!isFloatProduct || !hasConversionRate) {
    return null
  }

  // Calculate available pre-rolls based on inventory info
  const maxPrerolls = inventoryInfo?.max_prerolls || Math.floor(product.stock_quantity / conversionRate)
  const virtualReady = inventoryInfo?.preroll_product?.virtual_count || 0
  const totalAvailable = virtualReady + maxPrerolls

  const handleConvert = async () => {
    if (!onConvert || prerollCount <= 0) return
    
    setIsConverting(true)
    try {
      await onConvert(prerollCount)
      setPrerollCount(1)
      setShowConversionUI(false)
      onConversionSuccess?.()
      
      // Refresh inventory info
      const newInfo = await checkVirtualInventory(product.id, currentLocation?.id)
      setInventoryInfo(newInfo)
    } catch (error) {
      console.error('Conversion failed:', error)
    } finally {
      setIsConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-3 p-2 bg-vscode-bgTertiary/50 border border-white/[0.04] rounded">
        <Loader2 className="w-4 h-4 animate-spin text-vscode-textMuted" />
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs text-vscode-textMuted">Pre-Roll Management (Float Product)</div>
      
      {/* Inventory Status - Compact Design */}
      <div className="bg-vscode-bgTertiary/50 border border-white/[0.04] rounded p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3 text-vscode-textMuted" />
              <span className="text-vscode-text font-medium">{virtualReady}</span>
              <span className="text-vscode-textMuted">ready</span>
            </div>
            <div className="text-vscode-textMuted">•</div>
            <div className="flex items-center gap-1">
              <span className="text-vscode-textSecondary">{maxPrerolls}</span>
              <span className="text-vscode-textMuted">can make</span>
            </div>
          </div>
          {currentLocation && (
            <span className="text-vscode-textMuted text-xs">@ {currentLocation.name}</span>
          )}
        </div>
        
        {/* Conversion Rate Info */}
        <div className="mt-1 text-xs text-vscode-textMuted flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{conversionRate}g per pre-roll • {inventoryInfo?.location_stock?.toFixed(1) || product.stock_quantity.toFixed(1)}g available</span>
        </div>
        
        {/* Linked Pre-roll Product Info */}
        {inventoryInfo?.preroll_product && (
          <div className="mt-2 pt-2 border-t border-white/[0.04] text-xs text-vscode-textMuted">
            <span>Pre-roll SKU: </span>
            <span className="font-mono text-vscode-textSecondary">{inventoryInfo.preroll_product.sku}</span>
          </div>
        )}
      </div>

      {/* Conversion UI */}
      {!showConversionUI ? (
        <button
          onClick={() => setShowConversionUI(true)}
          disabled={maxPrerolls === 0}
          className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors ${
            maxPrerolls === 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
          }`}
        >
          Convert to Pre-Rolls
        </button>
      ) : (
        <div className="bg-vscode-bgTertiary/50 border border-white/[0.04] rounded p-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-vscode-textMuted">Pre-rolls to create</label>
            <span className="text-xs text-vscode-textMuted">{(prerollCount * conversionRate).toFixed(1)}g needed</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrerollCount(Math.max(1, prerollCount - 1))}
              className="w-7 h-7 bg-vscode-bgSecondary hover:bg-vscode-bgTertiary rounded text-vscode-text flex items-center justify-center transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={prerollCount}
              onChange={(e) => setPrerollCount(Math.max(1, Math.min(maxPrerolls, parseInt(e.target.value) || 1)))}
              className="w-16 h-7 bg-vscode-bgSecondary text-vscode-text text-center rounded text-sm border border-white/[0.04] focus:border-vscode-primary focus:outline-none"
            />
            <button
              onClick={() => setPrerollCount(Math.min(maxPrerolls, prerollCount + 1))}
              className="w-7 h-7 bg-vscode-bgSecondary hover:bg-vscode-bgTertiary rounded text-vscode-text flex items-center justify-center transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              disabled={isConverting || prerollCount > maxPrerolls}
              className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isConverting || prerollCount > maxPrerolls
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert'
              )}
            </button>
            <button
              onClick={() => {
                setShowConversionUI(false)
                setPrerollCount(1)
              }}
              className="px-3 py-1.5 bg-vscode-bgSecondary hover:bg-vscode-bgTertiary text-vscode-text rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 