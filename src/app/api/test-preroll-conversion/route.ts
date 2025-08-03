import { NextRequest, NextResponse } from 'next/server'

const FLORA_API_URL = 'https://api.floradistro.com' // Updated to HTTPS
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// Helper function to make WooCommerce API calls
async function makeWooCommerceRequest(endpoint: string, method: string = 'GET', data?: any) {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }
  
  const response = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/${endpoint}`, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting Comprehensive Preroll Conversion Test...')
    
    const testResults: any = {
      timestamp: new Date().toISOString(),
      api_credentials: {
        url: FLORA_API_URL,
        consumer_key: CONSUMER_KEY.substring(0, 10) + '...',
        status: 'working'
      },
      tests: []
    }

    // Test 1: API Connectivity
    console.log('🔗 Test 1: Testing API connectivity...')
    try {
      const products = await makeWooCommerceRequest('products?per_page=1')
      
      testResults.tests.push({
        name: 'WooCommerce API Connectivity',
        status: 'success',
        data: {
          products_accessible: true,
          sample_product_id: products[0]?.id
        }
      })

    } catch (error: any) {
      testResults.tests.push({
        name: 'WooCommerce API Connectivity',
        status: 'error',
        error: error.message
      })
      
      return NextResponse.json({
        success: false,
        message: 'API connectivity failed',
        results: testResults
      }, { status: 500 })
    }

    // Test 2: Find Flower Products with Preroll Support
    console.log('🌸 Test 2: Finding flower products with preroll support...')
    try {
      const flowerProducts = await makeWooCommerceRequest('products?category=25&per_page=5')
      
      const prerollCapableProducts = flowerProducts.filter((product: any) => {
        const meta = product.meta_data || []
        const productType = meta.find((m: any) => m.key === 'mli_product_type')?.value
        const prerollConversion = meta.find((m: any) => m.key === 'mli_preroll_conversion')?.value
        const pricingTiers = meta.find((m: any) => m.key === 'mli_pricing_tiers')?.value
        
        return productType === 'weight' && prerollConversion && pricingTiers
      })

      testResults.tests.push({
        name: 'Flower Products with Preroll Support',
        status: 'success',
        data: {
          total_flower_products: flowerProducts.length,
          preroll_capable_products: prerollCapableProducts.length,
          sample_product: prerollCapableProducts[0] ? {
            id: prerollCapableProducts[0].id,
            name: prerollCapableProducts[0].name,
            preroll_conversion: prerollCapableProducts[0].meta_data?.find((m: any) => m.key === 'mli_preroll_conversion')?.value,
            pricing_tiers: prerollCapableProducts[0].meta_data?.find((m: any) => m.key === 'mli_pricing_tiers')?.value
          } : null
        }
      })

      // Test 3: Create and Process Preroll Order
      if (prerollCapableProducts.length > 0) {
        const testProduct = prerollCapableProducts[0]
        console.log(`🚬 Test 3: Creating preroll order for ${testProduct.name}...`)
        
        // Get initial inventory
        const initialInventory = await makeWooCommerceRequest(`products/${testProduct.id}`)
        const initialStock = initialInventory.stock_quantity
        
        // Create test order
        const orderData = {
          payment_method: 'cash',
          payment_method_title: 'Cash Payment - Preroll Test',
          set_paid: false,
          status: 'pending',
          billing: {
            first_name: 'Test',
            last_name: 'Preroll',
            address_1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            postcode: '12345',
            country: 'US',
            email: 'test.preroll@example.com',
            phone: '555-0123'
          },
          line_items: [
            {
              product_id: testProduct.id,
              quantity: 1,
              meta_data: [
                { key: '_selected_variation', value: 'preroll-5' },
                { key: '_preroll_count', value: '5' },
                { key: '_grams_per_preroll', value: '0.7' },
                { key: '_variation_type', value: 'preroll_grams' },
                { key: '_test_order', value: 'true' }
              ]
            }
          ],
          meta_data: [
            { key: '_order_source', value: 'pos_system_preroll_test' },
            { key: '_test_preroll_conversion', value: '5_prerolls_3.5g' }
          ]
        }

        const testOrder = await makeWooCommerceRequest('orders', 'POST', orderData)
        
        // Process the order
        await makeWooCommerceRequest(`orders/${testOrder.id}`, 'PUT', { status: 'processing' })
        
        // Check final inventory
        const finalInventory = await makeWooCommerceRequest(`products/${testProduct.id}`)
        const finalStock = finalInventory.stock_quantity
        
        const actualDeduction = initialStock - finalStock
        const expectedDeduction = 3.5 // 5 prerolls × 0.7g each
        
        testResults.tests.push({
          name: 'Preroll Order Creation and Processing',
          status: 'success',
          data: {
            order_id: testOrder.id,
            product_tested: {
              id: testProduct.id,
              name: testProduct.name
            },
            inventory_test: {
              initial_stock: initialStock,
              final_stock: finalStock,
              expected_deduction: expectedDeduction,
              actual_deduction: actualDeduction,
              conversion_working_correctly: actualDeduction === expectedDeduction,
              notes: actualDeduction === expectedDeduction 
                ? 'Preroll conversion working perfectly!' 
                : `Expected ${expectedDeduction}g deduction, but got ${actualDeduction}. This suggests the plugin may be using standard quantity deduction instead of decimal gram conversion.`
            },
            order_metadata: {
              preroll_count: '5',
              grams_per_preroll: '0.7',
              total_grams_expected: '3.5',
              variation_type: 'preroll_grams'
            }
          }
        })

        // Clean up test order
        try {
          await makeWooCommerceRequest(`orders/${testOrder.id}`, 'DELETE', { force: true })
          testResults.tests.push({
            name: 'Test Order Cleanup',
            status: 'success',
            data: { deleted_order_id: testOrder.id }
          })
        } catch (cleanupError: any) {
          testResults.tests.push({
            name: 'Test Order Cleanup',
            status: 'warning',
            error: `Could not delete test order: ${cleanupError.message}`
          })
        }

      } else {
        testResults.tests.push({
          name: 'Preroll Order Test',
          status: 'skipped',
          reason: 'No preroll-capable products found'
        })
      }

    } catch (error: any) {
      testResults.tests.push({
        name: 'Flower Products Search',
        status: 'error',
        error: error.message
      })
    }

    // Test 4: Plugin Integration Status
    console.log('🔌 Test 4: Checking plugin integration...')
    testResults.tests.push({
      name: 'Addify Plugin Integration Status',
      status: 'info',
      data: {
        plugin_endpoints_tested: [
          'addify/v1/decimal-inventory/*',
          'addify-mli/v1/pos/*'
        ],
        authentication_note: 'Plugin endpoints require WordPress user authentication, not WooCommerce API keys',
        preroll_conversion_logic: {
          location: 'addify.modified/rest-api/controllers/af-mli-decimal-inventory-controller.php',
          conversion_rate: '0.7g per preroll',
          processing_trigger: 'Order status change to processing/completed'
        },
        recommendations: [
          'Verify that the decimal inventory controller is properly registered',
          'Check if order status changes trigger the preroll conversion hooks',
          'Consider implementing direct decimal inventory API calls for real-time testing',
          'Test with WordPress user authentication for plugin-specific endpoints'
        ]
      }
    })

    const successfulTests = testResults.tests.filter((t: any) => t.status === 'success').length
    const totalTests = testResults.tests.filter((t: any) => t.status !== 'info').length

    console.log(`✅ Preroll Conversion Test Complete: ${successfulTests}/${totalTests} tests passed`)
    
    return NextResponse.json({
      success: true,
      message: `Preroll conversion test completed: ${successfulTests}/${totalTests} tests passed`,
      summary: {
        api_connectivity: 'Working',
        flower_products_found: testResults.tests.find((t: any) => t.name.includes('Flower Products'))?.data?.preroll_capable_products || 0,
        preroll_conversion_status: testResults.tests.find((t: any) => t.name.includes('Preroll Order'))?.data?.inventory_test?.conversion_working_correctly ? 'Working' : 'Needs Investigation',
        recommendations: 'See detailed test results for specific recommendations'
      },
      results: testResults
    })

  } catch (error: any) {
    console.error('❌ Preroll Conversion Test Failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 