import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = 'https://api.floradistro.com';
    console.log(`🔄 [${'PROD'}] Fetching customers...`);
    
    const { searchParams } = new URL(request.url);
    const bustCache = searchParams.get('_');
    
    // Fetch customers from WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers`;
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      per_page: '100',
      status: 'any'
    });

    if (bustCache) {
      params.append('_', bustCache);
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': bustCache ? 'no-cache' : 'default',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const customers = await response.json();
    
    // Transform to user format
    const users = customers.map((customer: any) => ({
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      username: customer.username || customer.email.split('@')[0],
      email: customer.email,
      roles: ['customer'],
      display_name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username || customer.email
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = 'https://api.floradistro.com';
    console.log(`🔄 [${'PROD'}] Creating customer...`);
    
    const body = await request.json();
    
    // Create new customer via WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers`;
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    // WooCommerce requires email, so generate one if not provided
    const email = body.email || `customerdeclinedemail@floradistro.com`;
    
    const customerData = {
      email: email,
      first_name: body.first_name || body.name?.split(' ')[0] || '',
      last_name: body.last_name || body.name?.split(' ').slice(1).join(' ') || '',
      username: body.username,
      password: body.password,
      billing: body.billing || {},
      shipping: body.shipping || {}
    };

    console.log(`📤 [${'PROD'}] Sending customer data to:`, url);
    console.log(`👤 Customer data:`, customerData);
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${'PROD'}] WooCommerce API error:`, response.status, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Failed to create customer: ${response.status}`);
    }

    const newCustomer = await response.json();
    
    // Transform to our format
    const transformedUser = {
      id: newCustomer.id,
      name: `${newCustomer.first_name} ${newCustomer.last_name}`.trim() || newCustomer.username,
      username: newCustomer.username,
      email: newCustomer.email || '',
      roles: ['customer'],
      display_name: `${newCustomer.first_name} ${newCustomer.last_name}`.trim() || newCustomer.username
    };

    console.log(`✅ [${'PROD'}] Customer created successfully:`, newCustomer.id);
    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error(`❌ Failed to create customer in ${'PROD'}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 500 }
    );
  }
}