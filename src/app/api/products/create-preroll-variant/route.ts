import { NextRequest, NextResponse } from 'next/server'
import { createWooHeaders } from '@/lib/woocommerce'

const FLORA_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flower_product_id, auto_assign_inventories = true } = body

    if (!flower_product_id) {
      return NextResponse.json(
        { success: false, message: 'Flower product ID required' },
        { status: 400 }
      )
    }

    // 1. Get the flower product
    const flowerResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${flower_product_id}`, {
      headers: createWooHeaders()
    })
    
    if (!flowerResponse.ok) {
      throw new Error('Failed to fetch flower product')
    }
    
    const flowerProduct = await flowerResponse.json()
    
    // 2. Check if pre-roll already exists
    const existingCheckResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/products?sku=${flowerProduct.sku}-PR&per_page=1`,
      { headers: createWooHeaders() }
    )
    
    if (existingCheckResponse.ok) {
      const existing = await existingCheckResponse.json()
      if (existing.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Pre-roll product already exists',
          existing_product: existing[0]
        })
      }
    }

    // 3. Get pre-roll category
    const categoriesResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/products/categories?slug=pr`,
      { headers: createWooHeaders() }
    )
    
    let prerollCategoryId = null
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json()
      if (categories.length > 0) {
        prerollCategoryId = categories[0].id
      }
    }

    // 4. Create pre-roll product data
    const prerollData = {
      name: `${flowerProduct.name} - Pre-Rolls`,
      type: 'simple',
      regular_price: '6.00', // Default price per pre-roll
      description: `Pre-rolled joints made from ${flowerProduct.name} flower. Each pre-roll contains 0.7g.`,
      short_description: `0.7g pre-rolls of ${flowerProduct.name}`,
      sku: `${flowerProduct.sku}-PR`,
      manage_stock: true,
      stock_quantity: 0, // Start with 0, will be managed by conversions
      stock_status: 'instock',
      categories: prerollCategoryId ? [{ id: prerollCategoryId }] : [],
      meta_data: [
        { key: '_source_flower_id', value: flower_product_id.toString() },
        { key: '_conversion_rate', value: '0.7' },
        { key: '_product_type', value: 'preroll' },
        { key: '_virtual_product', value: 'yes' },
        { key: 'mli_product_type', value: 'quantity' } // Pre-rolls are sold by quantity
      ]
    }

    // 5. Create the pre-roll product
    const createResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products`, {
      method: 'POST',
      headers: createWooHeaders(),
      body: JSON.stringify(prerollData)
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      throw new Error(`Failed to create pre-roll product: ${error}`)
    }

    const prerollProduct = await createResponse.json()

    // 6. If auto-assign inventories, get all locations and create inventory entries
    let inventoryAssignments = []
    
    if (auto_assign_inventories) {
      // Get all locations where flower product has inventory
      const bulkInventoryResponse = await fetch(
        `${FLORA_API_URL}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`,
        {
          method: 'POST',
          headers: createWooHeaders(),
          body: JSON.stringify({
            product_ids: [flower_product_id]
          })
        }
      )

      if (bulkInventoryResponse.ok) {
        const inventoryData = await bulkInventoryResponse.json()
        const flowerInventories = inventoryData[flower_product_id] || []
        
        // Create inventory for pre-roll at each location
        for (const flowerInv of flowerInventories) {
          try {
            const createInvResponse = await fetch(
              `${FLORA_API_URL}/wp-json/wc/v3/addify_headless_inventory/products`,
              {
                method: 'POST',
                headers: createWooHeaders(),
                body: JSON.stringify({
                  product_id: prerollProduct.id,
                  location_id: flowerInv.location_id,
                  quantity: 0, // Start with 0
                  allow_negative: false
                })
              }
            )
            
            if (createInvResponse.ok) {
              const invResult = await createInvResponse.json()
              inventoryAssignments.push({
                location_id: flowerInv.location_id,
                location_name: flowerInv.location_name,
                inventory_id: invResult.id,
                success: true
              })
            }
          } catch (invError) {
            console.error(`Failed to create inventory for location ${flowerInv.location_id}:`, invError)
            inventoryAssignments.push({
              location_id: flowerInv.location_id,
              error: invError instanceof Error ? invError.message : 'Unknown error'
            })
          }
        }
      }
    }

    // 7. Link the products by updating flower product metadata
    await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${flower_product_id}`, {
      method: 'PUT',
      headers: createWooHeaders(),
      body: JSON.stringify({
        meta_data: [
          { key: '_linked_preroll_product_id', value: prerollProduct.id.toString() },
          { key: '_preroll_sku', value: prerollProduct.sku }
        ]
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Pre-roll product created successfully',
      data: {
        flower_product: {
          id: flowerProduct.id,
          name: flowerProduct.name,
          sku: flowerProduct.sku
        },
        preroll_product: {
          id: prerollProduct.id,
          name: prerollProduct.name,
          sku: prerollProduct.sku,
          permalink: prerollProduct.permalink
        },
        inventory_assignments: inventoryAssignments
      }
    })

  } catch (error) {
    console.error('Pre-roll creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create pre-roll product',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if a flower product has a pre-roll variant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    
    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID required' },
        { status: 400 }
      )
    }

    // Get flower product
    const productResponse = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/products/${productId}`, {
      headers: createWooHeaders()
    })
    
    if (!productResponse.ok) {
      throw new Error('Product not found')
    }
    
    const product = await productResponse.json()
    
    // Check for linked pre-roll
    const linkedPrerollId = product.meta_data?.find(
      (m: any) => m.key === '_linked_preroll_product_id'
    )?.value
    
    let prerollProduct = null
    if (linkedPrerollId) {
      const prerollResponse = await fetch(
        `${FLORA_API_URL}/wp-json/wc/v3/products/${linkedPrerollId}`,
        { headers: createWooHeaders() }
      )
      
      if (prerollResponse.ok) {
        prerollProduct = await prerollResponse.json()
      }
    }
    
    // Also check by SKU pattern
    if (!prerollProduct) {
      const checkResponse = await fetch(
        `${FLORA_API_URL}/wp-json/wc/v3/products?sku=${product.sku}-PR`,
        { headers: createWooHeaders() }
      )
      
      if (checkResponse.ok) {
        const results = await checkResponse.json()
        if (results.length > 0) {
          prerollProduct = results[0]
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        flower_product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        has_preroll: !!prerollProduct,
        preroll_product: prerollProduct
      }
    })

  } catch (error) {
    console.error('Pre-roll check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check pre-roll product',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 