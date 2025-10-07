import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const woocommerceApiUrl = 'https://api.floradistro.com';
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
