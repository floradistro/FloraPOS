// Cart handler for virtual pre-roll products
// This ensures virtual products are handled correctly when added to cart

import { FloraProduct } from './woocommerce'
import { isVirtualPrerollProduct, getSourceFlowerId, calculateVirtualAvailability } from './virtual-product-helpers'

export interface VirtualProductCartItem {
  product: FloraProduct
  quantity: number
  sourceFlower?: FloraProduct
  availability?: {
    virtualReady: number
    canMake: number
    totalAvailable: number
  }
}

/**
 * Prepare virtual product for cart
 * Adds necessary metadata for proper order processing
 */
export function prepareVirtualProductForCart(
  virtualProduct: FloraProduct,
  quantity: number,
  sourceFlower?: FloraProduct
): any {
  // Basic cart item structure
  const cartItem: any = {
    product_id: virtualProduct.id,
    quantity: quantity,
    variation_id: 0, // Virtual products don't have variations
  }

  // Add metadata for order processing
  const metaData = []
  
  // Add source flower ID for inventory deduction
  const sourceFlowerId = getSourceFlowerId(virtualProduct)
  if (sourceFlowerId) {
    metaData.push({
      key: '_source_flower_id',
      value: sourceFlowerId.toString()
    })
  }
  
  // Add availability info if source flower provided
  if (sourceFlower) {
    const availability = calculateVirtualAvailability(sourceFlower)
    
    // Indicate how many will come from virtual vs fresh conversion
    const virtualUsed = Math.min(quantity, availability.virtualReady)
    const freshMade = quantity - virtualUsed
    
    if (virtualUsed > 0) {
      metaData.push({
        key: '_virtual_prerolls_used',
        value: virtualUsed.toString()
      })
    }
    
    if (freshMade > 0) {
      metaData.push({
        key: '_fresh_conversion_needed',
        value: freshMade.toString()
      })
    }
  }
  
  // Add product type indicator
  metaData.push({
    key: '_is_virtual_preroll',
    value: 'yes'
  })
  
  if (metaData.length > 0) {
    cartItem.meta_data = metaData
  }
  
  return cartItem
}

/**
 * Validate if virtual product can be added to cart
 */
export function validateVirtualProductQuantity(
  virtualProduct: FloraProduct,
  requestedQuantity: number,
  sourceFlower?: FloraProduct
): {
  valid: boolean
  message: string
  maxAvailable?: number
} {
  if (!isVirtualPrerollProduct(virtualProduct)) {
    return {
      valid: false,
      message: 'Not a virtual pre-roll product'
    }
  }
  
  if (!sourceFlower) {
    // Without source flower info, we can't validate
    // This would be caught during order processing
    return {
      valid: true,
      message: 'Quantity will be validated during checkout'
    }
  }
  
  const availability = calculateVirtualAvailability(sourceFlower)
  
  if (availability.totalAvailable === 0) {
    return {
      valid: false,
      message: 'Out of stock',
      maxAvailable: 0
    }
  }
  
  if (requestedQuantity > availability.totalAvailable) {
    return {
      valid: false,
      message: `Only ${availability.totalAvailable} available (${availability.virtualReady} ready, ${availability.canMake} can be made)`,
      maxAvailable: availability.totalAvailable
    }
  }
  
  return {
    valid: true,
    message: 'Available',
    maxAvailable: availability.totalAvailable
  }
}

/**
 * Get display information for virtual product in cart
 */
export function getVirtualProductCartDisplay(
  virtualProduct: FloraProduct,
  quantity: number,
  sourceFlower?: FloraProduct
): {
  name: string
  price: number
  subtotal: number
  stockInfo?: string
} {
  const price = parseFloat(virtualProduct.price || '0')
  const subtotal = price * quantity
  
  let stockInfo = undefined
  if (sourceFlower) {
    const availability = calculateVirtualAvailability(sourceFlower)
    const virtualUsed = Math.min(quantity, availability.virtualReady)
    const freshMade = quantity - virtualUsed
    
    if (virtualUsed > 0 && freshMade > 0) {
      stockInfo = `${virtualUsed} ready, ${freshMade} to be made fresh`
    } else if (virtualUsed > 0) {
      stockInfo = 'Ready for pickup'
    } else {
      stockInfo = 'Will be made fresh'
    }
  }
  
  return {
    name: virtualProduct.name,
    price,
    subtotal,
    stockInfo
  }
}

/**
 * Calculate total flower grams needed for virtual products in cart
 * Useful for validating entire cart before checkout
 */
export function calculateCartFlowerRequirements(
  cartItems: VirtualProductCartItem[]
): Map<number, number> {
  const flowerRequirements = new Map<number, number>()
  
  for (const item of cartItems) {
    if (!isVirtualPrerollProduct(item.product)) continue
    
    const sourceFlowerId = getSourceFlowerId(item.product)
    if (!sourceFlowerId) continue
    
    // Calculate how much flower is needed
    const conversionRate = 0.7 // grams per pre-roll
    let gramsNeeded = item.quantity * conversionRate
    
    // Subtract virtual pre-rolls already available
    if (item.sourceFlower) {
      const virtualAvailable = item.sourceFlower.virtual_preroll_count || 0
      const virtualUsed = Math.min(item.quantity, virtualAvailable)
      const freshNeeded = item.quantity - virtualUsed
      gramsNeeded = freshNeeded * conversionRate
    }
    
    // Add to requirements
    const currentRequirement = flowerRequirements.get(sourceFlowerId) || 0
    flowerRequirements.set(sourceFlowerId, currentRequirement + gramsNeeded)
  }
  
  return flowerRequirements
} 