// Helper functions for virtual pre-roll products
// These functions help identify and link virtual pre-roll products to their source flower products

import { FloraProduct } from './woocommerce'

/**
 * Check if a product is a virtual pre-roll product
 * Looks for specific metadata that indicates it's a virtual product
 */
export function isVirtualPrerollProduct(product: FloraProduct): boolean {
  if (!product.meta_data) return false
  
  const metaData = Array.isArray(product.meta_data) ? product.meta_data : []
  
  // Check for virtual product flag
  const isVirtual = metaData.some(meta => 
    meta.key === '_virtual_product' && meta.value === 'yes'
  )
  
  // Check for product type
  const isPreroll = metaData.some(meta => 
    meta.key === '_product_type' && meta.value === 'preroll'
  )
  
  return isVirtual && isPreroll
}

/**
 * Get the source flower ID from a virtual pre-roll product
 */
export function getSourceFlowerId(product: FloraProduct): number | null {
  if (!product.meta_data) return null
  
  const metaData = Array.isArray(product.meta_data) ? product.meta_data : []
  const sourceFlowerMeta = metaData.find(meta => meta.key === '_source_flower_id')
  
  if (sourceFlowerMeta && sourceFlowerMeta.value) {
    return parseInt(sourceFlowerMeta.value)
  }
  
  return null
}

/**
 * Get the conversion rate for a virtual pre-roll product
 */
export function getConversionRate(product: FloraProduct): number {
  if (!product.meta_data) return 0.7 // default
  
  const metaData = Array.isArray(product.meta_data) ? product.meta_data : []
  const conversionMeta = metaData.find(meta => meta.key === '_conversion_rate')
  
  if (conversionMeta && conversionMeta.value) {
    return parseFloat(conversionMeta.value)
  }
  
  return 0.7 // default conversion rate
}

/**
 * Find virtual pre-roll products linked to a flower product
 */
export function findLinkedPrerollProducts(
  flowerProduct: FloraProduct,
  allProducts: FloraProduct[]
): FloraProduct[] {
  return allProducts.filter(product => {
    if (!isVirtualPrerollProduct(product)) return false
    const sourceId = getSourceFlowerId(product)
    return sourceId === flowerProduct.id
  })
}

/**
 * Calculate virtual pre-roll availability based on flower stock
 */
export function calculateVirtualAvailability(
  flowerProduct: FloraProduct,
  conversionRate: number = 0.7
): {
  virtualReady: number
  canMake: number
  totalAvailable: number
} {
  const virtualReady = flowerProduct.virtual_preroll_count || 0
  const canMake = Math.floor(flowerProduct.stock_quantity / conversionRate)
  const totalAvailable = virtualReady + canMake
  
  return {
    virtualReady,
    canMake,
    totalAvailable
  }
}

/**
 * Format availability text for display
 */
export function formatAvailabilityText(
  virtualReady: number,
  canMake: number
): string {
  if (virtualReady === 0 && canMake === 0) {
    return 'Out of stock'
  }
  
  if (virtualReady > 0 && canMake > 0) {
    return `${virtualReady} ready, ${canMake} can be made`
  }
  
  if (virtualReady > 0) {
    return `${virtualReady} ready`
  }
  
  return `${canMake} can be made fresh`
}

/**
 * Check if a product should show virtual pre-roll management
 * (Only for flower products with pre-roll conversion capability)
 */
export function shouldShowVirtualManagement(product: FloraProduct): boolean {
  return (
    product.mli_product_type === 'weight' &&
    product.categories?.some(cat => cat.slug === 'flower') &&
    !!product.mli_preroll_conversion &&
    product.mli_preroll_conversion > 0
  )
}

/**
 * Create a mock virtual pre-roll product for testing
 * This helps test the UI before actually creating products in WooCommerce
 */
export function createMockVirtualPreroll(
  flowerProduct: FloraProduct,
  suffix: string = ' Pre-rolls'
): FloraProduct {
  const mockId = flowerProduct.id + 10000 // Ensure different ID
  
  return {
    ...flowerProduct,
    id: mockId,
    name: flowerProduct.name + suffix,
    sku: (flowerProduct.sku || `FLW-${flowerProduct.id}`) + '-PR',
    type: 'simple',
    manage_stock: false,
    stock_quantity: 0,
    in_stock: true, // Will be calculated based on flower
    price: '6', // Default pre-roll price
    regular_price: '6',
    meta_data: [
      { key: '_virtual_product', value: 'yes' },
      { key: '_source_flower_id', value: flowerProduct.id.toString() },
      { key: '_conversion_rate', value: '0.7' },
      { key: '_product_type', value: 'preroll' }
    ]
  }
} 