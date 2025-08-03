import { NextRequest, NextResponse } from 'next/server'
import { createWooHeaders } from '@/lib/woocommerce'

const FLORA_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, preroll_count, location_id, notes } = body

    if (!product_id || !preroll_count) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get the flower product
    const productResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${product_id}`, {
      headers: createWooHeaders()
    })
    
    if (!productResponse.ok) {
      throw new Error('Failed to fetch product')
    }
    
    const product = await productResponse.json()
    
    // Get conversion rate
    const conversionRate = product.meta_data?.find(
      (meta: any) => meta.key === 'mli_preroll_conversion'
    )?.value || 0.7

    const flowerNeeded = preroll_count * parseFloat(conversionRate)

    // Check stock availability at the location
    const stockQuery = location_id 
      ? `products/${product_id}?location_id=${location_id}`
      : `products/${product_id}`
    
    const stockResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/${stockQuery}`, {
      headers: createWooHeaders()
    })
    
    if (!stockResponse.ok) {
      throw new Error('Failed to check stock')
    }
    
    const stockData = await stockResponse.json()
    const availableStock = stockData.stock_quantity || 0

    if (availableStock < flowerNeeded) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient stock. Need ${flowerNeeded}g but only ${availableStock}g available` 
        },
        { status: 400 }
      )
    }

    // Update virtual pre-roll count in product metadata
    const currentVirtualCount = product.meta_data?.find(
      (meta: any) => meta.key === '_virtual_preroll_count'
    )?.value || 0

    const newVirtualCount = parseInt(currentVirtualCount) + preroll_count

    // Update the product with new virtual count
    const updateData = {
      meta_data: [
        {
          key: '_virtual_preroll_count',
          value: newVirtualCount.toString()
        },
        {
          key: '_last_preroll_conversion',
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            location_id,
            prerolls_created: preroll_count,
            flower_used: flowerNeeded,
            notes
          })
        }
      ]
    }

    // If location-specific, also update location-specific metadata
    if (location_id) {
      updateData.meta_data.push({
        key: `_location_${location_id}_virtual_preroll_count`,
        value: newVirtualCount.toString()
      })
    }

    const updateResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${product_id}`, {
      method: 'PUT',
      headers: createWooHeaders(),
      body: JSON.stringify(updateData)
    })
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update product')
    }

    // Log the conversion activity
    const activityLog = {
      action: 'conversion',
      product_id,
      location_id,
      prerolls_created: preroll_count,
      flower_used: flowerNeeded,
      timestamp: new Date().toISOString(),
      notes
    }

    // Here you would typically log this to a database or logging service
    console.log('Pre-roll conversion activity:', activityLog)

    return NextResponse.json({
      success: true,
      message: `Successfully converted ${flowerNeeded}g of flower into ${preroll_count} pre-rolls`,
      data: {
        product_id,
        location_id,
        prerolls_created: preroll_count,
        flower_used: flowerNeeded,
        new_virtual_count: newVirtualCount,
        conversion_rate: conversionRate
      }
    })

  } catch (error) {
    console.error('Pre-roll conversion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to convert pre-rolls',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const locationId = searchParams.get('location_id')

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID required' },
        { status: 400 }
      )
    }

    // Get product data
    const productResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${productId}`, {
      headers: createWooHeaders()
    })
    
    if (!productResponse.ok) {
      throw new Error('Failed to fetch product')
    }
    
    const product = await productResponse.json()
    
    // Get virtual inventory data
    const virtualCount = product.meta_data?.find(
      (meta: any) => meta.key === '_virtual_preroll_count'
    )?.value || 0

    const locationVirtualCount = locationId 
      ? product.meta_data?.find(
          (meta: any) => meta.key === `_location_${locationId}_virtual_preroll_count`
        )?.value || 0
      : virtualCount

    const conversionRate = product.meta_data?.find(
      (meta: any) => meta.key === 'mli_preroll_conversion'
    )?.value || 0.7

    const stockAvailable = product.stock_quantity || 0
    const maxCanMake = Math.floor(stockAvailable / parseFloat(conversionRate))

    return NextResponse.json({
      success: true,
      data: {
        product_id: productId,
        product_name: product.name,
        location_id: locationId,
        virtual_ready: parseInt(locationVirtualCount),
        can_make: maxCanMake,
        total_available: parseInt(locationVirtualCount) + maxCanMake,
        flower_stock: stockAvailable,
        conversion_rate: conversionRate
      }
    })

  } catch (error) {
    console.error('Virtual inventory check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check virtual inventory',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 