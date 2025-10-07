import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Fetching customer...`);
    
    const customerId = params.id;
    
    // Fetch customer data from WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${customerId}`;
    const apiParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${url}?${apiParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({}, { status: 404 });
      }
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const customer = await response.json();
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json({}, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Updating customer...`);
    
    const customerId = params.id;
    const body = await request.json();
    
    // Update customer via WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${customerId}`;
    const apiParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${url}?${apiParams.toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update customer: ${response.status}`);
    }

    const updatedCustomer = await response.json();
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update customer' },
      { status: 500 }
    );
  }
}