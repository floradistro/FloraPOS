import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL || 'https://api.floradistro.com'
const WC_CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WC_CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId') || '13580'

  try {
    // Fetch order details
    const orderResponse = await fetch(
      `${WC_API_URL}/wp-json/wc/v3/orders/${orderId}`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
      }
    )

    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.statusText}`)
    }

    const order = await orderResponse.json()
    
    // Analyze order for preroll processing
    const analysis = {
      orderId: order.id,
      status: order.status,
      createdVia: order.created_via,
      lineItems: order.line_items.map((item: any) => {
        // Extract metadata
        const metaData: any = {}
        item.meta_data.forEach((meta: any) => {
          metaData[meta.key] = meta.value
        })
        
        // Check if it's a preroll order
        const variation = metaData.variation || metaData._selected_variation || ''
        const isPrerollVariation = variation.startsWith('preroll-')
        const prerollCount = isPrerollVariation ? parseInt(variation.replace('preroll-', '')) : 0
        
        return {
          itemId: item.id,
          productId: item.product_id,
          productName: item.name,
          quantity: item.quantity,
          metadata: metaData,
          analysis: {
            variation,
            isPrerollVariation,
            prerollCount,
            virtualAvailable: metaData._virtual_prerolls_available || 0,
            shouldUseVirtual: isPrerollVariation && parseInt(metaData._virtual_prerolls_available || 0) > 0,
            inventoryDetail: metaData.af_mli_inventory_detail || {},
            location: metaData.selected_location ? JSON.parse(metaData.selected_location) : null
          }
        }
      }),
      
      // Check product virtual inventory
      products: await Promise.all(
        order.line_items.map(async (item: any) => {
          const productResponse = await fetch(
            `${WC_API_URL}/wp-json/wc/v3/products/${item.product_id}`,
            {
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64'),
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (productResponse.ok) {
            const product = await productResponse.json()
            const virtualCount = product.meta_data.find((m: any) => m.key === '_virtual_preroll_count')?.value || 0
            const conversionRate = product.meta_data.find((m: any) => m.key === 'mli_preroll_conversion')?.value || 0.7
            
            return {
              productId: product.id,
              productName: product.name,
              virtualPrerollCount: virtualCount,
              conversionRate,
              stockQuantity: product.stock_quantity
            }
          }
          return null
        })
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      debugInfo: {
        timestamp: new Date().toISOString(),
        expectedBehavior: 'Virtual pre-rolls should be used first before deducting from flower inventory',
        actualBehavior: 'Check if virtual count decreased and flower stock was preserved'
      }
    })
  } catch (error) {
    console.error('Debug preroll order error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 