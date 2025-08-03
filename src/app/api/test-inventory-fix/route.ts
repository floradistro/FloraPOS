import { NextRequest, NextResponse } from 'next/server'

const FLORA_API_URL = 'https://api.floradistro.com'
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

async function makeWooCommerceRequest(endpoint: string, method: string = 'GET', data?: any) {
  const url = `${FLORA_API_URL}/wp-json/wc/v3${endpoint}`
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Plugin Inventory Fix...')
    
    // Test with Purple Pineapple (product 732) - the one that had the issue
    const productId = 732
    
    // Get initial stock
    const initialProduct = await makeWooCommerceRequest(`/products/${productId}`)
    const initialStock = initialProduct.stock_quantity
    
    console.log(`📊 Initial stock for ${initialProduct.name}: ${initialStock}`)
    
    // Create test order with 2 prerolls (should deduct 1.4g)
    const orderData = {
      payment_method: 'cash',
      payment_method_title: 'Cash Payment - Plugin Fix Test',
      set_paid: false,
      status: 'pending',
      billing: {
        first_name: 'Plugin',
        last_name: 'Test',
        address_1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postcode: '12345',
        country: 'US',
        email: 'plugintest@test.com',
        phone: '555-0123'
      },
      line_items: [
        {
          product_id: productId,
          quantity: 1,
          meta_data: [
            {
              key: '_selected_variation',
              value: 'preroll-2'
            },
            {
              key: '_variation_type',
              value: 'preroll_grams'
            },
            {
              key: '_preroll_count',
              value: '2'
            },
            {
              key: '_grams_per_preroll',
              value: '0.7'
            },
            {
              key: '_quantity_is_grams',
              value: 'yes'
            }
          ]
        }
      ],
      meta_data: [
        {
          key: '_order_source',
          value: 'plugin_fix_test'
        }
      ]
    }
    
    // Create the order
    const order = await makeWooCommerceRequest('/orders', 'POST', orderData)
    console.log(`📦 Created test order: ${order.id}`)
    
    // Process the order to trigger inventory deduction
    await makeWooCommerceRequest(`/orders/${order.id}`, 'PUT', { status: 'processing' })
    console.log(`⚡ Processed order to trigger inventory deduction`)
    
    // Wait 2 seconds for processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get updated order with metadata
    const updatedOrder = await makeWooCommerceRequest(`/orders/${order.id}`)
    const lineItem = updatedOrder.line_items[0]
    
    // Check final stock
    const finalProduct = await makeWooCommerceRequest(`/products/${productId}`)
    const finalStock = finalProduct.stock_quantity
    
    // Calculate actual deduction
    const actualDeduction = initialStock - finalStock
    const expectedDeduction = 1.4 // 2 prerolls × 0.7g
    
    // Extract key metadata
    const metadata = lineItem.meta_data
    const decimalQty = metadata.find((m: any) => m.key === 'af_mli_decimal_qty')?.value
    const lastDeductedQty = metadata.find((m: any) => m.key === 'af_mli_last_qty_detail')?.value?.last_deducted_qty
    const reducedStock = metadata.find((m: any) => m.key === '_reduced_stock')?.value
    
    // Determine if fix is working
    const isFixWorking = parseFloat(lastDeductedQty || '0') === expectedDeduction
    
    const results = {
      product: {
        id: productId,
        name: initialProduct.name
      },
      inventory_test: {
        initial_stock: initialStock,
        final_stock: finalStock,
        expected_deduction: expectedDeduction,
        actual_deduction: actualDeduction,
        fix_working: isFixWorking
      },
      plugin_metadata: {
        af_mli_decimal_qty: decimalQty,
        last_deducted_qty: lastDeductedQty,
        reduced_stock: reducedStock
      },
      order_id: order.id,
      status: isFixWorking ? '✅ PLUGIN FIX WORKING' : '❌ PLUGIN FIX NOT WORKING'
    }
    
    // Clean up test order
    await makeWooCommerceRequest(`/orders/${order.id}?force=true`, 'DELETE')
    console.log(`🧹 Cleaned up test order`)
    
    return NextResponse.json({
      success: true,
      message: isFixWorking ? 'Plugin fix is working correctly!' : 'Plugin fix is not working - file needs to be uploaded',
      results
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
} 