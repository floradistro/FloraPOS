'use client'

import { useState, useEffect } from 'react'
import { Package, RefreshCw, Target, AlertCircle, Check } from 'lucide-react'
import { FloraProduct } from '../lib/woocommerce'

interface EnhancedVirtualPrerollSectionProps {
  product: FloraProduct
  linkedPrerollProduct?: FloraProduct // The virtual pre-roll product linked to this flower
  onConvert?: (count: number) => Promise<void>
  onConversionSuccess?: () => void
}

export function EnhancedVirtualPrerollSection({ 
  product, 
  linkedPrerollProduct,
  onConvert, 
  onConversionSuccess 
}: EnhancedVirtualPrerollSectionProps) {
  const [showConversion, setShowConversion] = useState(false)
  const [conversionCount, setConversionCount] = useState(10)
  const [isConverting, setIsConverting] = useState(false)
  const [localVirtualCount, setLocalVirtualCount] = useState(product.virtual_preroll_count || 0)
  
  // Update local count when product changes
  useEffect(() => {
    setLocalVirtualCount(product.virtual_preroll_count || 0)
  }, [product.virtual_preroll_count])
  
  // Only show for flower products
  if (product.mli_product_type !== 'weight' || !product.mli_preroll_conversion) {
    return null
  }
  
  const virtualCount = localVirtualCount
  const target = product.preroll_target || 50 // Higher target for virtual products
  const conversionRate = product.mli_preroll_conversion || 0.7
  
  // Calculate inventory
  const gramsNeeded = conversionCount * conversionRate
  const canConvert = product.stock_quantity >= gramsNeeded
  const canMake = Math.floor(product.stock_quantity / conversionRate)
  const totalAvailable = virtualCount + canMake
  
  // Determine status
  const getStatusColor = () => {
    if (virtualCount === 0) return 'text-red-400'
    if (virtualCount < target * 0.3) return 'text-orange-400'
    if (virtualCount >= target) return 'text-green-400'
    return 'text-yellow-400'
  }
  
  const handleConvert = async () => {
    if (!canConvert || isConverting) return
    
    setIsConverting(true)
    try {
      if (onConvert) {
        await onConvert(conversionCount)
        
        // Optimistically update the local count
        setLocalVirtualCount(prev => prev + conversionCount)
        
        if (onConversionSuccess) {
          onConversionSuccess()
        }
      }
      setShowConversion(false)
      setConversionCount(10)
    } catch (error) {
      console.error('Conversion failed:', error)
      // Reset optimistic update on error
      setLocalVirtualCount(product.virtual_preroll_count || 0)
    } finally {
      setIsConverting(false)
    }
  }
  
  return (
    <div className="w-full space-y-3 border border-white/[0.08] rounded-lg p-4 bg-black/20">
      {/* Header with Linked Product Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <div>
            <span className="text-sm font-medium text-white">Virtual Pre-Roll Management</span>
            {linkedPrerollProduct && (
              <div className="text-xs text-vscode-textMuted">
                Linked to: {linkedPrerollProduct.name} (SKU: {linkedPrerollProduct.sku})
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowConversion(!showConversion)}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="Convert flower to pre-rolls"
        >
          <RefreshCw className="w-4 h-4 text-vscode-textMuted hover:text-white" />
        </button>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-vscode-bgTertiary p-2 rounded">
          <div className="text-xs text-vscode-textMuted">Ready Now</div>
          <div className={`text-lg font-bold ${getStatusColor()}`}>{virtualCount}</div>
        </div>
        <div className="bg-vscode-bgTertiary p-2 rounded">
          <div className="text-xs text-vscode-textMuted">Can Make</div>
          <div className="text-lg font-bold text-blue-400">{canMake}</div>
        </div>
        <div className="bg-vscode-bgTertiary p-2 rounded">
          <div className="text-xs text-vscode-textMuted">Total Available</div>
          <div className="text-lg font-bold text-green-400">{totalAvailable}</div>
        </div>
      </div>
      
      {/* Target Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-vscode-textMuted">Target: {target} pre-rolls ready</span>
          <span className={getStatusColor()}>{Math.round((virtualCount / target) * 100)}%</span>
        </div>
        <div className="relative h-2 bg-vscode-bgTertiary rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-300 ${
              virtualCount === 0 ? 'bg-red-400' :
              virtualCount < target * 0.3 ? 'bg-orange-400' :
              virtualCount >= target ? 'bg-green-400' : 'bg-yellow-400'
            }`}
            style={{ width: `${Math.min((virtualCount / target) * 100, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Conversion Panel */}
      {showConversion && (
        <div className="bg-vscode-bgTertiary p-4 rounded space-y-3 border border-white/[0.08]">
          <div className="text-sm font-medium">Convert Flower to Virtual Pre-Rolls</div>
          
          {/* Quick Convert Options */}
          <div className="flex gap-2">
            {[10, 20, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => setConversionCount(count)}
                disabled={product.stock_quantity < count * conversionRate}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  conversionCount === count
                    ? 'bg-blue-500 text-white'
                    : product.stock_quantity >= count * conversionRate
                    ? 'bg-vscode-bg text-vscode-text hover:bg-white/10'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          
          {/* Custom Input */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={Math.floor(product.stock_quantity / conversionRate)}
              value={conversionCount}
              onChange={(e) => setConversionCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 bg-vscode-bg text-white text-sm rounded border border-white/10 focus:border-blue-400"
            />
            <span className="text-sm text-vscode-textMuted">
              pre-rolls = {gramsNeeded.toFixed(1)}g of flower
            </span>
          </div>
          
          {/* Conversion Info */}
          <div className="bg-black/30 p-3 rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-vscode-textMuted">Current flower stock:</span>
              <span>{product.stock_quantity}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-vscode-textMuted">After conversion:</span>
              <span>{(product.stock_quantity - gramsNeeded).toFixed(1)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-vscode-textMuted">Virtual pre-rolls after:</span>
              <span className="text-green-400">{virtualCount + conversionCount}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              disabled={!canConvert || isConverting}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                canConvert && !isConverting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Convert {conversionCount} Pre-rolls
                </>
              )}
            </button>
            <button
              onClick={() => setShowConversion(false)}
              className="px-4 py-2 rounded text-sm font-medium bg-vscode-bgTertiary text-vscode-textMuted hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {!canConvert && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4" />
              Insufficient stock. Need {gramsNeeded.toFixed(1)}g, have {product.stock_quantity}g
            </div>
          )}
        </div>
      )}
      
      {/* Activity Summary */}
      <div className="flex justify-between text-xs text-vscode-textMuted pt-2 border-t border-white/[0.05]">
        <span>Lifetime converted: {product.total_prerolls_converted || 0}</span>
        <span>Lifetime sold: {product.total_prerolls_sold || 0}</span>
      </div>
      
      {/* How It Works Info */}
      {linkedPrerollProduct && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs space-y-1">
          <div className="font-medium text-blue-400">How Virtual Pre-rolls Work:</div>
          <ul className="space-y-1 text-vscode-textMuted">
            <li>• Staff converts flower to virtual pre-rolls here</li>
            <li>• Customers purchase "{linkedPrerollProduct.name}" as a separate product</li>
            <li>• When sold, it automatically deducts from this virtual inventory first</li>
            <li>• If not enough virtual stock, it converts flower on-demand</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default EnhancedVirtualPrerollSection 