import { NextRequest, NextResponse } from 'next/server'
import { createWooHeaders } from '@/lib/woocommerce'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, locationId = 30 } = body // Default to Charlotte Monroe (30)

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // First check if this is a virtual pre-roll product
    const productResponse = await fetch(`${API_BASE}/wp-json/wc/v3/products/${productId}`, {
      headers: createWooHeaders()
    })

    if (!productResponse.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await productResponse.json()
    
    // Check if it's a virtual product
    const isVirtual = product.meta_data?.find((m: any) => m.key === '_virtual_product')?.value === 'yes'
    
    if (!isVirtual) {
      return NextResponse.json({ 
        error: 'Not a virtual product', 
        details: 'This endpoint only creates inventory for virtual pre-roll products' 
      }, { status: 400 })
    }

    // Create inventory for the virtual product
    // Note: Virtual products should have 0 quantity as their stock is calculated from source flower
    const inventoryResponse = await fetch(
      `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`,
      {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          location_id: locationId,
          quantity: 0, // Virtual products always have 0 direct inventory
          name: `${product.name} - Virtual Inventory`
        })
      }
    )

    if (!inventoryResponse.ok) {
      const error = await inventoryResponse.text()
      console.error('Failed to create inventory:', error)
      return NextResponse.json({ 
        error: 'Failed to create inventory',
        details: error 
      }, { status: 500 })
    }

    const inventory = await inventoryResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Virtual product inventory created',
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      inventory: inventory
    })

  } catch (error) {
    console.error('Create inventory error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inventory' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if virtual products have inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const locationId = searchParams.get('locationId') || '30'

    if (!productId) {
      // List all virtual products without inventory
      const productsResponse = await fetch(
        `${API_BASE}/wp-json/wc/v3/products?per_page=100&category=25`,
        { headers: createWooHeaders() }
      )

      const products = await productsResponse.json()
      
      // Filter virtual products
      const virtualProducts = products.filter((p: any) => 
        p.meta_data?.find((m: any) => m.key === '_virtual_product')?.value === 'yes'
      )

      // Check which ones have inventory
      const results = await Promise.all(
        virtualProducts.map(async (p: any) => {
          const bulkResponse = await fetch(
            `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`,
            {
              method: 'POST',
              headers: createWooHeaders(),
              body: JSON.stringify({
                product_ids: [p.id],
                location_id: parseInt(locationId)
              })
            }
          )

          const bulkData = await bulkResponse.json()
          const hasInventory = bulkData[p.id] && bulkData[p.id].length > 0

          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            has_inventory: hasInventory,
            inventory_count: bulkData[p.id]?.length || 0
          }
        })
      )

      return NextResponse.json({
        total_virtual_products: virtualProducts.length,
        with_inventory: results.filter(r => r.has_inventory).length,
        without_inventory: results.filter(r => !r.has_inventory).length,
        products: results
      })
    }

    // Check specific product
    const bulkResponse = await fetch(
      `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`,
      {
        method: 'POST',
        headers: createWooHeaders(),
        body: JSON.stringify({
          product_ids: [parseInt(productId)],
          location_id: parseInt(locationId)
        })
      }
    )

    const bulkData = await bulkResponse.json()
    const inventory = bulkData[productId] || []

    return NextResponse.json({
      product_id: productId,
      location_id: locationId,
      has_inventory: inventory.length > 0,
      inventory: inventory
    })

  } catch (error) {
    console.error('Check inventory error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check inventory' },
      { status: 500 }
    )
  }
} 