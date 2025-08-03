// Pre-roll Migration Script
// Converts flower products with pre-roll pricing tiers into separate virtual pre-roll products

import { FloraProduct } from './woocommerce'

export interface VirtualPrerollProduct {
  name: string
  sku: string
  status: 'publish'
  type: 'simple'
  regular_price: string
  price: string
  description: string
  short_description: string
  manage_stock: boolean
  stock_quantity: number
  categories: number[] | Array<{ id: number }>
  meta_data: Array<{
    key: string
    value: any
  }>
  images?: Array<{
    src: string
    alt: string
  }>
}

export interface PrerollMigrationConfig {
  conversion_rate?: number // Default 0.7g per pre-roll
  name_suffix?: string // Default " Pre-rolls"
  sku_suffix?: string // Default "-PR"
  default_bundle_sizes?: number[] // Default [1, 3, 5]
}

const DEFAULT_CONFIG: PrerollMigrationConfig = {
  conversion_rate: 0.7,
  name_suffix: " Pre-rolls",
  sku_suffix: "-PR",
  default_bundle_sizes: [1, 3, 5]
}

/**
 * Generate a virtual pre-roll product from a flower product
 */
export function createVirtualPrerollProduct(
  flowerProduct: FloraProduct,
  config: PrerollMigrationConfig = DEFAULT_CONFIG
): VirtualPrerollProduct | null {
  // Only process flower products with pre-roll pricing
  if (!flowerProduct.preroll_pricing_tiers || Object.keys(flowerProduct.preroll_pricing_tiers).length === 0) {
    return null
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Generate SKU (fallback to ID if no SKU exists)
  const baseSku = flowerProduct.sku || `FLW-${flowerProduct.id}`
  const prerollSku = `${baseSku}${mergedConfig.sku_suffix}`
  
  // Calculate base price (price for 1 pre-roll)
  const singlePrerollPrice = flowerProduct.preroll_pricing_tiers['1'] || 
    (parseFloat(flowerProduct.price) * (mergedConfig.conversion_rate || 0.7) * 1.5) // 1.5x markup if no pricing
  
  // Build the virtual pre-roll product
  const virtualProduct: VirtualPrerollProduct = {
    name: `${flowerProduct.name}${mergedConfig.name_suffix}`,
    sku: prerollSku,
    status: 'publish',
    type: 'simple',
    regular_price: singlePrerollPrice.toFixed(2),
    price: singlePrerollPrice.toFixed(2),
    description: `Pre-rolled ${flowerProduct.name}. Each pre-roll contains ${mergedConfig.conversion_rate}g of premium flower.`,
    short_description: `${mergedConfig.conversion_rate}g pre-rolls made from ${flowerProduct.name}`,
    manage_stock: false, // Virtual product - no direct stock
    stock_quantity: 0,
    categories: flowerProduct.categories.map(cat => ({ id: cat.id })),
    meta_data: [
      {
        key: '_virtual_product',
        value: 'yes'
      },
      {
        key: '_source_flower_id',
        value: flowerProduct.id.toString()
      },
      {
        key: '_source_flower_sku',
        value: flowerProduct.sku || ''
      },
      {
        key: '_conversion_rate',
        value: mergedConfig.conversion_rate?.toString() || '0.7'
      },
      {
        key: '_bundle_pricing',
        value: JSON.stringify(flowerProduct.preroll_pricing_tiers)
      },
      {
        key: '_product_type',
        value: 'preroll'
      },
      {
        key: '_backorders',
        value: 'notify' // Allow backorders since stock is calculated from flower
      }
    ]
  }
  
  // Copy the first image if available
  if (flowerProduct.images && flowerProduct.images.length > 0) {
    virtualProduct.images = [{
      src: flowerProduct.images[0].src,
      alt: `${flowerProduct.name} Pre-rolls`
    }]
  }
  
  return virtualProduct
}

/**
 * Generate migration data for all flower products
 */
export function generateMigrationData(
  flowerProducts: FloraProduct[],
  config?: PrerollMigrationConfig
): {
  virtualProducts: VirtualPrerollProduct[]
  skuMapping: Record<string, string> // Maps flower SKU to pre-roll SKU
  idMapping: Record<number, string> // Maps flower ID to pre-roll SKU
} {
  const virtualProducts: VirtualPrerollProduct[] = []
  const skuMapping: Record<string, string> = {}
  const idMapping: Record<number, string> = {}
  
  for (const flower of flowerProducts) {
    const virtual = createVirtualPrerollProduct(flower, config)
    if (virtual) {
      virtualProducts.push(virtual)
      
      // Create mappings for easy lookup
      const flowerSku = flower.sku || `FLW-${flower.id}`
      skuMapping[flowerSku] = virtual.sku
      idMapping[flower.id] = virtual.sku
    }
  }
  
  return {
    virtualProducts,
    skuMapping,
    idMapping
  }
}

/**
 * Calculate available pre-roll stock based on flower inventory
 */
export function calculateVirtualStock(
  flowerStock: number,
  conversionRate: number = 0.7,
  virtualPrerollsReady: number = 0
): {
  totalAvailable: number // Total pre-rolls that can be sold
  readyNow: number // Pre-rolls already made
  canMake: number // Additional pre-rolls that can be made
} {
  const canMake = Math.floor(flowerStock / conversionRate)
  
  return {
    totalAvailable: virtualPrerollsReady + canMake,
    readyNow: virtualPrerollsReady,
    canMake: canMake
  }
}

/**
 * Calculate inventory deduction when pre-rolls are sold
 */
export function calculateInventoryDeduction(
  quantitySold: number,
  virtualPrerollsAvailable: number,
  conversionRate: number = 0.7
): {
  virtualUsed: number // Pre-rolls from virtual inventory
  flowerNeeded: number // Grams to deduct from flower
  makeOnDemand: number // Pre-rolls to make fresh
} {
  const virtualUsed = Math.min(quantitySold, virtualPrerollsAvailable)
  const makeOnDemand = quantitySold - virtualUsed
  const flowerNeeded = makeOnDemand * conversionRate
  
  return {
    virtualUsed,
    flowerNeeded,
    makeOnDemand
  }
} 