import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('store_id')
    const perPage = searchParams.get('per_page') || '50'
    const orderBy = searchParams.get('orderby') || 'date'
    const order = searchParams.get('order') || 'desc'
    const after = searchParams.get('after')
    const before = searchParams.get('before')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // New filter parameters
    const paymentMethod = searchParams.get('payment_method')
    const minTotal = searchParams.get('min_total')
    const maxTotal = searchParams.get('max_total')
    const staffMember = searchParams.get('staff_member')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Build query parameters for WooCommerce API
    const params = new URLSearchParams({
      per_page: perPage,
      orderby: orderBy,
      order: order,
    })

    // Add date filters
    if (after) params.append('after', `${after}T00:00:00`)
    if (before) params.append('before', `${before}T23:59:59`)
    
    // Add status filter
    if (status) params.append('status', status)
    
    // Add search filter
    if (search) params.append('search', search)

    // Note: Store-specific filtering will be implemented based on Flora Distro's order structure
    // For now, we'll fetch all orders and can filter client-side or adjust based on their API structure

    const apiUrl = `https://api.floradistro.com/wp-json/wc/v3/orders?${params}`
    
    console.log('🔍 Fetching orders from:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ WooCommerce API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      return NextResponse.json(
        { error: 'Failed to fetch orders from WooCommerce' },
        { status: response.status }
      )
    }

    const orders = await response.json()
    console.log(`✅ Fetched ${orders.length} orders from Flora Distro API`)
    console.log('📋 Sample order structure:', orders[0] ? JSON.stringify(orders[0], null, 2) : 'No orders found')

    // Transform the data to match our interface
    const transformedOrders = orders.map((order: any) => {
      // Extract points earned from meta_data
      let pointsEarned = 0
      let pointsRedeemed = 0
      let processedByStaff = ''
      
      // Debug: Log meta_data for first few orders
      if (orders.indexOf(order) < 3) {
        console.log(`🔍 Order ${order.id} meta_data:`, order.meta_data)
      }
      
      if (order.meta_data && Array.isArray(order.meta_data)) {
        const pointsEarnedMeta = order.meta_data.find((meta: any) => meta.key === '_wc_points_earned')
        const pointsRedeemedMeta = order.meta_data.find((meta: any) => meta.key === '_wc_points_redeemed')
        // Prioritize cashier name over ID (staff managed by Addify Multi-Location Inventory)
        const staffMeta = order.meta_data.find((meta: any) => meta.key === '_cashier_name') ||
                         order.meta_data.find((meta: any) => meta.key === '_processed_by_staff') ||
                         order.meta_data.find((meta: any) => meta.key === '_cashier_id')
        
        if (pointsEarnedMeta && pointsEarnedMeta.value) {
          pointsEarned = parseInt(pointsEarnedMeta.value) || 0
          console.log(`💰 Order ${order.id} points earned:`, pointsEarned)
        }
        
        if (pointsRedeemedMeta && pointsRedeemedMeta.value) {
          pointsRedeemed = parseInt(pointsRedeemedMeta.value) || 0
          console.log(`💸 Order ${order.id} points redeemed:`, pointsRedeemed)
        }

        if (staffMeta && staffMeta.value) {
          processedByStaff = staffMeta.value
          console.log(`👤 Order ${order.id} processed by:`, processedByStaff)
        }
        
        // Debug: Look for any points-related meta keys
        const pointsRelatedMeta = order.meta_data.filter((meta: any) => 
          meta.key && meta.key.toLowerCase().includes('point')
        )
        if (pointsRelatedMeta.length > 0) {
          console.log(`🎯 Order ${order.id} points-related meta:`, pointsRelatedMeta)
        }
      } else {
        console.log(`⚠️ Order ${order.id} has no meta_data or meta_data is not an array`)
      }

      // For testing, let's add some mock points data to see the UI
      const mockPointsEarned = Math.floor(parseFloat(order.total || '0'))
      const shouldShowMockPoints = orders.indexOf(order) < 2 // Show on first 2 orders for testing

      return {
        id: order.id,
        number: order.number || order.id?.toString(),
        date_created: order.date_created,
        status: order.status,
        total: order.total,
        currency: order.currency || 'USD',
        payment_method: order.payment_method || '',
        payment_method_title: order.payment_method_title || '',
        billing: {
          first_name: order.billing?.first_name || '',
          last_name: order.billing?.last_name || '',
          email: order.billing?.email || '',
          phone: order.billing?.phone || '',
        },
        line_items: (order.line_items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.total,
        })),
        points_earned: pointsEarned || (shouldShowMockPoints ? mockPointsEarned : 0),
        points_redeemed: pointsRedeemed,
        processed_by_staff: processedByStaff,
      }
    })

    // Apply client-side filters
    let filteredOrders = transformedOrders

    // Filter by payment method
    if (paymentMethod && paymentMethod !== '') {
      filteredOrders = filteredOrders.filter((order: any) => 
        order.payment_method === paymentMethod
      )
      console.log(`💳 Filtered by payment method '${paymentMethod}': ${filteredOrders.length} orders`)
    }

    // Filter by order total range
    if (minTotal || maxTotal) {
      filteredOrders = filteredOrders.filter((order: any) => {
        const total = parseFloat(order.total || '0')
        const min = minTotal ? parseFloat(minTotal) : 0
        const max = maxTotal ? parseFloat(maxTotal) : Infinity
        return total >= min && total <= max
      })
      console.log(`💰 Filtered by total range $${minTotal || '0'}-$${maxTotal || '∞'}: ${filteredOrders.length} orders`)
    }

    // Filter by staff member
    if (staffMember && staffMember !== '') {
      filteredOrders = filteredOrders.filter((order: any) => {
        // Only include orders that have a processed_by_staff value
        if (!order.processed_by_staff || order.processed_by_staff === '') {
          return false
        }
        
        // Exact match or close variations
        const orderStaff = order.processed_by_staff.toLowerCase().trim()
        const filterStaff = staffMember.toLowerCase().trim()
        
        return orderStaff === filterStaff ||
               orderStaff === filterStaff.replace(/\s+/g, '') ||
               filterStaff === orderStaff.replace(/\s+/g, '')
      })
      console.log(`👤 Filtered by staff member '${staffMember}': ${filteredOrders.length} orders`)
    }

    // Temporarily show all orders for testing - location filtering disabled
    console.log(`🏪 Showing ${filteredOrders.length} orders (after filters applied)`)
    
    // TODO: Re-enable location filtering once we understand the user's location setup
    /*
    if (storeId) {
      filteredOrders = transformedOrders.filter((order: any) => {
        // Check meta_data for location information
        const originalOrder = orders.find((o: any) => o.id === order.id)
        if (originalOrder?.meta_data) {
          // Look for location information in meta_data
          const locationMeta = originalOrder.meta_data.find((meta: any) => 
            meta.key === '_order_source_location' || meta.key === 'selected_location'
          )
          
          if (locationMeta) {
            // Handle different location formats
            if (locationMeta.key === '_order_source_location') {
              return locationMeta.value.toString().toLowerCase().includes(storeId.toLowerCase())
            } else if (locationMeta.key === 'selected_location' && typeof locationMeta.value === 'string') {
              try {
                const locationData = JSON.parse(locationMeta.value)
                return locationData.selected_value === storeId || 
                       locationData.selected_text?.toLowerCase().includes(storeId.toLowerCase())
              } catch (e) {
                return false
              }
            }
          }
        }
        return false
      })
      
      console.log(`🏪 Filtered to ${filteredOrders.length} orders for location: ${storeId}`)
    }
    */

    return NextResponse.json(filteredOrders)

  } catch (error) {
    console.error('❌ Error in orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    console.log('🛒 Creating order via API route:', orderData)
    
    // Log line items metadata for debugging
    console.log('📦 Line items with metadata:')
    orderData.line_items?.forEach((item: any, index: number) => {
      console.log(`  Item ${index + 1}: Product ${item.product_id}`)
      console.log(`    Quantity: ${item.quantity}`)
      console.log(`    Metadata:`, item.meta_data)
    })
    
    // Forward the order creation to WooCommerce API
    const apiUrl = 'https://api.floradistro.com/wp-json/wc/v3/orders'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      console.error('❌ WooCommerce order creation failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      return NextResponse.json(
        { error: 'Failed to create order', details: errorText },
        { status: response.status }
      )
    }

    const order = await response.json()
    console.log('✅ Order created successfully:', order)
    
    return NextResponse.json(order)

  } catch (error) {
    console.error('❌ Error in order creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 