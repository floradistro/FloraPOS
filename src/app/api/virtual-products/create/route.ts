import { NextRequest, NextResponse } from 'next/server'
import { floraAPI, createWooHeaders } from '@/lib/woocommerce'
import { 
  shouldShowVirtualManagement,
  isVirtualPrerollProduct,
  getSourceFlowerId 
} from '@/lib/virtual-product-helpers'
import { createVirtualPrerollProduct } from '@/lib/preroll-migration'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'

/**
 * Create a single virtual pre-roll product in WooCommerce
 */
async function createProductInWooCommerce(productData: any) {
  const response = await fetch(`${API_BASE}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: createWooHeaders(),
    body: JSON.stringify(productData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create product: ${error}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flowerProductId, dryRun = true } = body

    if (!flowerProductId) {
      return NextResponse.json({ error: 'flowerProductId is required' }, { status: 400 })
    }

    // Fetch the flower product
    const products = await floraAPI.getProducts({ per_page: 100 })
    const flowerProduct = products.find(p => p.id === parseInt(flowerProductId))

    if (!flowerProduct) {
      return NextResponse.json({ error: 'Flower product not found' }, { status: 404 })
    }

    // Check if it's eligible
    if (!shouldShowVirtualManagement(flowerProduct)) {
      return NextResponse.json({ 
        error: 'Product is not eligible for virtual pre-roll creation',
        reason: 'Must be a flower product with pre-roll conversion capability'
      }, { status: 400 })
    }

    // Check if virtual product already exists
    const existingVirtual = products.find(p => {
      if (!isVirtualPrerollProduct(p)) return false
      const sourceId = getSourceFlowerId(p)
      return sourceId === flowerProduct.id
    })

    if (existingVirtual) {
      return NextResponse.json({ 
        error: 'Virtual pre-roll product already exists',
        existing_product: {
          id: existingVirtual.id,
          name: existingVirtual.name,
          sku: existingVirtual.sku
        }
      }, { status: 409 })
    }

    // Create virtual product data
    const virtualProduct = createVirtualPrerollProduct(flowerProduct)

    if (!virtualProduct) {
      return NextResponse.json({ 
        error: 'Failed to generate virtual product data' 
      }, { status: 500 })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        message: 'Virtual product would be created',
        flower_product: {
          id: flowerProduct.id,
          name: flowerProduct.name,
          sku: flowerProduct.sku,
          stock: flowerProduct.stock_quantity,
          virtual_ready: flowerProduct.virtual_preroll_count || 0
        },
        virtual_product: virtualProduct
      })
    }

    // Create the product in WooCommerce
    const created = await createProductInWooCommerce(virtualProduct)

    return NextResponse.json({
      success: true,
      dry_run: false,
      message: 'Virtual pre-roll product created successfully',
      flower_product: {
        id: flowerProduct.id,
        name: flowerProduct.name,
        sku: flowerProduct.sku
      },
      created_product: {
        id: created.id,
        name: created.name,
        sku: created.sku,
        permalink: created.permalink
      }
    })

  } catch (error) {
    console.error('Virtual product creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Creation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // List all products that need virtual pre-roll products created
    const products = await floraAPI.getProducts({ per_page: 100 })
    
    // Find eligible flower products
    const eligibleFlowers = products.filter(p => shouldShowVirtualManagement(p))
    
    // Find existing virtual products
    const virtualProducts = products.filter(p => isVirtualPrerollProduct(p))
    
    // Map which flowers already have virtual products
    const results = eligibleFlowers.map(flower => {
      const linkedVirtual = virtualProducts.find(v => {
        const sourceId = getSourceFlowerId(v)
        return sourceId === flower.id
      })
      
      return {
        flower: {
          id: flower.id,
          name: flower.name,
          sku: flower.sku,
          stock: flower.stock_quantity,
          virtual_ready: flower.virtual_preroll_count || 0
        },
        has_virtual_product: !!linkedVirtual,
        virtual_product: linkedVirtual ? {
          id: linkedVirtual.id,
          name: linkedVirtual.name,
          sku: linkedVirtual.sku
        } : null
      }
    })
    
    const needsCreation = results.filter(r => !r.has_virtual_product)
    const alreadyCreated = results.filter(r => r.has_virtual_product)
    
    return NextResponse.json({
      success: true,
      summary: {
        total_eligible: eligibleFlowers.length,
        already_created: alreadyCreated.length,
        needs_creation: needsCreation.length
      },
      needs_creation: needsCreation,
      already_created: alreadyCreated
    })
    
  } catch (error) {
    console.error('Virtual product list error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'List failed' },
      { status: 500 }
    )
  }
} 