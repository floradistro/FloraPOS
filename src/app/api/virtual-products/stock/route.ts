import { NextRequest, NextResponse } from 'next/server'
import { floraAPI } from '@/lib/woocommerce'
import {
  isVirtualPrerollProduct,
  getSourceFlowerId,
  getConversionRate,
  calculateVirtualAvailability,
  formatAvailabilityText
} from '@/lib/virtual-product-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const locationId = searchParams.get('locationId')
    
    // Fetch products
    const products = await floraAPI.getProducts({ 
      per_page: 100,
      ...(locationId && { storeId: locationId })
    })
    
    if (productId) {
      // Get stock for a specific virtual product
      const virtualProduct = products.find(p => p.id === parseInt(productId))
      
      if (!virtualProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      
      if (!isVirtualPrerollProduct(virtualProduct)) {
        return NextResponse.json({ 
          error: 'Not a virtual pre-roll product',
          is_virtual: false
        }, { status: 400 })
      }
      
      const sourceFlowerId = getSourceFlowerId(virtualProduct)
      const conversionRate = getConversionRate(virtualProduct)
      
      if (!sourceFlowerId) {
        return NextResponse.json({ 
          error: 'No source flower ID found' 
        }, { status: 500 })
      }
      
      // Find the source flower product
      const sourceFlower = products.find(p => p.id === sourceFlowerId)
      
      if (!sourceFlower) {
        return NextResponse.json({ 
          error: 'Source flower product not found',
          source_flower_id: sourceFlowerId
        }, { status: 404 })
      }
      
      // Calculate availability
      const availability = calculateVirtualAvailability(sourceFlower, conversionRate)
      const displayText = formatAvailabilityText(availability.virtualReady, availability.canMake)
      
      return NextResponse.json({
        success: true,
        virtual_product: {
          id: virtualProduct.id,
          name: virtualProduct.name,
          sku: virtualProduct.sku
        },
        source_flower: {
          id: sourceFlower.id,
          name: sourceFlower.name,
          stock_quantity: sourceFlower.stock_quantity,
          virtual_preroll_count: sourceFlower.virtual_preroll_count || 0
        },
        conversion_rate: conversionRate,
        availability: {
          ...availability,
          display_text: displayText,
          in_stock: availability.totalAvailable > 0
        }
      })
    }
    
    // List all virtual products with their stock status
    const virtualProducts = products.filter(p => isVirtualPrerollProduct(p))
    
    const stockStatuses = virtualProducts.map(virtualProduct => {
      const sourceFlowerId = getSourceFlowerId(virtualProduct)
      const conversionRate = getConversionRate(virtualProduct)
      const sourceFlower = sourceFlowerId ? products.find(p => p.id === sourceFlowerId) : null
      
      if (!sourceFlower) {
        return {
          virtual_product: {
            id: virtualProduct.id,
            name: virtualProduct.name,
            sku: virtualProduct.sku
          },
          error: 'Source flower not found',
          availability: {
            virtualReady: 0,
            canMake: 0,
            totalAvailable: 0,
            in_stock: false
          }
        }
      }
      
      const availability = calculateVirtualAvailability(sourceFlower, conversionRate)
      const displayText = formatAvailabilityText(availability.virtualReady, availability.canMake)
      
      return {
        virtual_product: {
          id: virtualProduct.id,
          name: virtualProduct.name,
          sku: virtualProduct.sku
        },
        source_flower: {
          id: sourceFlower.id,
          name: sourceFlower.name,
          stock_quantity: sourceFlower.stock_quantity
        },
        availability: {
          ...availability,
          display_text: displayText,
          in_stock: availability.totalAvailable > 0
        }
      }
    })
    
    const inStock = stockStatuses.filter(s => s.availability.in_stock)
    const outOfStock = stockStatuses.filter(s => !s.availability.in_stock)
    
    return NextResponse.json({
      success: true,
      summary: {
        total_virtual_products: virtualProducts.length,
        in_stock: inStock.length,
        out_of_stock: outOfStock.length
      },
      stock_statuses: stockStatuses
    })
    
  } catch (error) {
    console.error('Virtual stock check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stock check failed' },
      { status: 500 }
    )
  }
} 