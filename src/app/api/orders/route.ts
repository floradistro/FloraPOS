import { NextRequest, NextResponse } from 'next/server';

const WOOCOMMERCE_API_URL = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';
    const status = searchParams.get('status') || 'any';
    const location = searchParams.get('location');
    const locationId = searchParams.get('location_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const employee = searchParams.get('employee');
    
    // Fetch orders from WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders`;
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      page: page,
      per_page: perPage,
      orderby: orderby,
      order: order,
      status: status
    });

    // Add customer filter if specified (for customer-specific views)
    if (customer) {
      params.append('customer', customer);
    }

    // Add date filters if specified
    if (dateFrom) {
      params.append('after', `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      params.append('before', `${dateTo}T23:59:59`);
    }

    // Note: Employee filter will be handled client-side for now
    // as WooCommerce doesn't have a direct employee filter

    let orders = [];
    let totalHeader = '0';
    let totalPages = '1';

    if (locationId) {
      // Try multiple location metadata keys to catch orders from different systems
      const locationKeys = ['_pos_location_id', '_flora_location_id', '_store_id'];
      const orderMap = new Map(); // Use Map to deduplicate by order ID
      let maxTotal = 0;
      let maxPages = 1;

      console.log(`🏢 [Orders API] Fetching orders for location_id: ${locationId} using multiple metadata keys`);

      for (const metaKey of locationKeys) {
        try {
          const locationParams = new URLSearchParams(params);
          locationParams.append('meta_key', metaKey);
          locationParams.append('meta_value', locationId);

          const response = await fetch(`${url}?${locationParams.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(8000), // 8 second timeout instead of 10
          });

          if (response.ok) {
            const locationOrders = await response.json();
            const locationTotal = parseInt(response.headers.get('X-WP-Total') || '0');
            const locationPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

            console.log(`🔍 Found ${locationOrders.length} orders with ${metaKey}=${locationId}`);

            // Add unique orders (by ID) to map
            locationOrders.forEach((order: any) => {
              orderMap.set(order.id, order);
            });

            // Track the highest counts (approximation since we're deduplicating)
            maxTotal = Math.max(maxTotal, locationTotal);
            maxPages = Math.max(maxPages, locationPages);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch orders with ${metaKey}:`, error);
        }
      }

      // Convert map values back to array
      orders = Array.from(orderMap.values());
      totalHeader = orders.length.toString(); // Use actual count of deduplicated orders
      totalPages = Math.ceil(orders.length / parseInt(perPage)).toString();

      console.log(`✅ Total unique orders found for location ${locationId}: ${orders.length}`);
      
      // Debug: Log ALL orders' location metadata to see why wrong ones are showing
      if (orders.length > 0) {
        console.log(`🔍 [API Debug] ALL ${orders.length} orders and their location metadata:`);
        orders.forEach((order: any) => {
          const locationMeta = order.meta_data?.filter((meta: any) => 
            meta.key.includes('location') || meta.key.includes('store') || meta.key.includes('pos')
          ) || [];
          
          // Extract specific location values
          const posLocationId = order.meta_data?.find((m: any) => m.key === '_pos_location_id')?.value;
          const floraLocationId = order.meta_data?.find((m: any) => m.key === '_flora_location_id')?.value;
          const storeId = order.meta_data?.find((m: any) => m.key === '_store_id')?.value;
          const posLocationName = order.meta_data?.find((m: any) => m.key === '_pos_location_name')?.value;
          
          console.log(`  Order #${order.id}: pos_loc=${posLocationId}, flora_loc=${floraLocationId}, store=${storeId}, pos_name="${posLocationName}"`);
        });
      }
    } else if (location) {
      // Filter by location name
      params.append('meta_key', '_pos_location_name');
      params.append('meta_value', location);
      console.log(`🏢 [Orders API] Filtering by location name: ${location}`);

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status}`);
      }

      orders = await response.json();
      totalHeader = response.headers.get('X-WP-Total') || '0';
      totalPages = response.headers.get('X-WP-TotalPages') || '1';
    } else {
      // If customer filter is specified, allow fetching orders for that customer
      if (customer) {
        console.log(`👤 [Orders API] Fetching orders for customer: ${customer}`);
        
        const response = await fetch(`${url}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });

        if (!response.ok) {
          throw new Error(`WooCommerce API error: ${response.status}`);
        }

        orders = await response.json();
        totalHeader = response.headers.get('X-WP-Total') || '0';
        totalPages = response.headers.get('X-WP-TotalPages') || '1';
      } else {
        // No location or customer filter specified - for security, return empty results
        console.warn(`⚠️ [Orders API] No location or customer filter specified - returning empty results for security`);
        orders = [];
        totalHeader = '0';
        totalPages = '1';
      }
    }
    
    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        total: parseInt(totalHeader),
        pages: parseInt(totalPages),
        page: parseInt(page),
        per_page: parseInt(perPage)
      }
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    
    // Return error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
      data: [],
      meta: {
        total: 0,
        pages: 1,
        page: parseInt(request.nextUrl.searchParams.get('page') || '1'),
        per_page: parseInt(request.nextUrl.searchParams.get('per_page') || '20')
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [Orders API] Creating new order:', body);
    
    // Create order via WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders`;
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `Failed to create order: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const order = await response.json();
    console.log('✅ [Orders API] Order created successfully:', order.id);
    
    return NextResponse.json({
      success: true,
      data: order,
      order_id: order.id,
      order_number: order.number
    });
  } catch (error) {
    console.error('Failed to create order:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    }, { status: 500 });
  }
}