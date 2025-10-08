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
    console.log(`🔄 [${apiEnv.toUpperCase()}] Updating order...`);
    
    const body = await request.json();
    const orderId = params.id;
    
    console.log(`🔄 [Orders API] Updating order ${orderId}:`, body);
    
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API update error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `Failed to update order: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const order = await response.json();
    console.log(`✅ [Orders API] Order ${orderId} updated to status: ${order.status}`);
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Failed to update order:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order'
    }, { status: 500 });
  }
}
