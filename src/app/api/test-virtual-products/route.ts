import { NextRequest, NextResponse } from 'next/server'
import { floraAPI } from '@/lib/woocommerce'
import {
  isVirtualPrerollProduct,
  getSourceFlowerId,
  getConversionRate,
  findLinkedPrerollProducts,
  calculateVirtualAvailability,
  shouldShowVirtualManagement,
  createMockVirtualPreroll
} from '@/lib/virtual-product-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'
    const productId = searchParams.get('productId')
    
    // Fetch all products
    const products = await floraAPI.getProducts({ per_page: 100 })
    
    if (action === 'test') {
      // Test detection of virtual products and linking
      const flowerProducts = products.filter(p => 
        p.categories?.some(cat => cat.slug === 'flower')
      )
      
      const results = flowerProducts.map(flower => {
        // Create mock virtual pre-roll for testing
        const mockPreroll = createMockVirtualPreroll(flower)
        
        // Test helper functions
        const shouldManage = shouldShowVirtualManagement(flower)
        const availability = calculateVirtualAvailability(flower)
        
        return {
          flower: {
            id: flower.id,
            name: flower.name,
            sku: flower.sku,
            stock: flower.stock_quantity,
            virtual_prerolls: flower.virtual_preroll_count || 0,
            should_manage: shouldManage
          },
          mock_preroll: {
            id: mockPreroll.id,
            name: mockPreroll.name,
            sku: mockPreroll.sku,
            is_virtual: isVirtualPrerollProduct(mockPreroll),
            source_flower_id: getSourceFlowerId(mockPreroll),
            conversion_rate: getConversionRate(mockPreroll)
          },
          availability: availability
        }
      })
      
      return NextResponse.json({
        success: true,
        action: 'test',
        total_flowers: flowerProducts.length,
        results: results.filter(r => r.flower.should_manage) // Only show manageable flowers
      })
    }
    
    if (action === 'check' && productId) {
      // Check a specific product
      const product = products.find(p => p.id === parseInt(productId))
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      
      const isVirtual = isVirtualPrerollProduct(product)
      const sourceId = getSourceFlowerId(product)
      const conversionRate = getConversionRate(product)
      const shouldManage = shouldShowVirtualManagement(product)
      
      let linkedProducts: ReturnType<typeof findLinkedPrerollProducts> = []
      if (!isVirtual && shouldManage) {
        // If it's a flower, find linked pre-roll products
        linkedProducts = findLinkedPrerollProducts(product, products)
      }
      
      let sourceFlower = null
      if (isVirtual && sourceId) {
        // If it's a pre-roll, find source flower
        sourceFlower = products.find(p => p.id === sourceId)
      }
      
      return NextResponse.json({
        success: true,
        action: 'check',
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          type: product.type,
          is_virtual_preroll: isVirtual,
          should_show_management: shouldManage,
          meta_data: product.meta_data
        },
        virtual_info: isVirtual ? {
          source_flower_id: sourceId,
          conversion_rate: conversionRate,
          source_flower: sourceFlower ? {
            id: sourceFlower.id,
            name: sourceFlower.name,
            stock: sourceFlower.stock_quantity
          } : null
        } : null,
        linked_products: linkedProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        }))
      })
    }
    
    if (action === 'simulate') {
      // Simulate creating virtual products for all eligible flowers
      const flowerProducts = products.filter(p => 
        shouldShowVirtualManagement(p)
      )
      
      const simulatedProducts = flowerProducts.map(flower => {
        const mockPreroll = createMockVirtualPreroll(flower)
        const availability = calculateVirtualAvailability(flower)
        
        return {
          source_flower: {
            id: flower.id,
            name: flower.name,
            sku: flower.sku || `FLW-${flower.id}`,
            stock: flower.stock_quantity,
            virtual_ready: flower.virtual_preroll_count || 0
          },
          virtual_preroll: {
            id: mockPreroll.id,
            name: mockPreroll.name,
            sku: mockPreroll.sku,
            price: mockPreroll.price,
            meta_data: mockPreroll.meta_data
          },
          availability: {
            ...availability,
            display_text: `${availability.totalAvailable} available (${availability.virtualReady} ready, ${availability.canMake} can make)`
          }
        }
      })
      
      return NextResponse.json({
        success: true,
        action: 'simulate',
        total_eligible: flowerProducts.length,
        simulated_products: simulatedProducts
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Virtual product test API',
      available_actions: ['test', 'check', 'simulate'],
      usage: {
        test: '/api/test-virtual-products?action=test',
        check: '/api/test-virtual-products?action=check&productId=123',
        simulate: '/api/test-virtual-products?action=simulate'
      }
    })
    
  } catch (error) {
    console.error('Virtual product test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
} 