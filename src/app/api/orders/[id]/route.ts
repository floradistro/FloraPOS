import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const woocommerceApiUrl = getApiBaseUrl(apiEnv);
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
    
    const body = await request.json();
    const orderId = params.id;
    
    // Validate order ID
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 [${apiEnv.toUpperCase()}] Updating order ${orderId}...`);
    
    // Update order via WooCommerce API
    const updateUrl = `${woocommerceApiUrl}/wp-json/wc/v3/orders/${orderId}`;
    const urlParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${updateUrl}?${urlParams.toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WooCommerce API update error:', response.status, response.statusText, errorText);
      
      // Parse error message if possible
      let errorMessage = `Failed to update order: ${response.status}`;
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
    
    // Validate response
    if (!order || !order.id) {
      console.error('❌ Invalid order update response');
      return NextResponse.json(
        { error: 'Order update failed - invalid response' },
        { status: 500 }
      );
    }
    
    console.log(`✅ [Orders API] Order ${orderId} updated to status: ${order.status}`);
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('❌ Exception updating order:', error);
    
    let errorMessage = 'Failed to update order';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Order update timed out. Please try again.';
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
