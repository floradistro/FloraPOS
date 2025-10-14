import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('⚡ Orders API - Using FAST bulk endpoint');
    
    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const status = searchParams.get('status') || 'any';
    const locationId = searchParams.get('location_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    // Build params for bulk endpoint
    const bulkParams = new URLSearchParams({
      page,
      per_page: perPage,
      status
    });
    
    if (locationId) bulkParams.append('location_id', locationId);
    if (customer) bulkParams.append('customer_id', customer);
    if (dateFrom) bulkParams.append('date_from', dateFrom);
    if (dateTo) bulkParams.append('date_to', dateTo);
    
    // Get API environment for credentials
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    const BASE_URL = getApiBaseUrl(apiEnv);
    
    // Call bulk orders endpoint directly
    const bulkUrl = `${BASE_URL}/wp-json/flora-im/v1/orders/bulk?${bulkParams.toString()}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const response = await fetch(bulkUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Bulk orders API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log(`⚡ Loaded ${result.meta?.total || 0} orders in ${result.meta?.load_time_ms || 0}ms (${result.meta?.queries_executed || 0} queries)`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    
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
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    // Validate credentials
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('❌ Missing WooCommerce credentials');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      );
    }
    
    console.log(`🔄 [${apiEnv.toUpperCase()}] Creating new order at ${WOOCOMMERCE_API_URL}...`);
    
    const body = await request.json();
    
    // Validate order data
    if (!body.line_items || body.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    
    // Validate payment method
    if (!body.payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 [Orders API] Creating order with ${body.line_items.length} items`);
    
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
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WooCommerce API error:', response.status, response.statusText, errorText);
      
      let errorMessage = `Failed to create order: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorText.substring(0, 200) || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorText.substring(0, 500) },
        { status: response.status }
      );
    }

    const order = await response.json();
    
    if (!order || !order.id) {
      console.error('❌ Invalid order response - no ID returned');
      return NextResponse.json(
        { error: 'Order creation failed - no order ID in response' },
        { status: 500 }
      );
    }
    
    console.log(`✅ [Orders API] Order #${order.id} created successfully`);
    
    return NextResponse.json({
      success: true,
      data: order,
      order_id: order.id,
      order_number: order.number
    });
  } catch (error) {
    console.error('❌ Exception creating order:', error);
    
    let errorMessage = 'Failed to create order';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Order creation timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
