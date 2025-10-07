import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials();
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '100';
    
    if (userId) {
      // Fetch specific user
      const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${userId}`;
      const params = new URLSearchParams({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      });

      const response = await fetch(`${url}?${params.toString()}`);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch user: ${response.status}` },
          { status: response.status }
        );
      }

      const user = await response.json();
      return NextResponse.json(user);
    }
    
    // Fetch all customers
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers`;
    const params = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      page: page,
      per_page: perPage,
      orderby: 'registered_date',
      order: 'desc'
    });

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch customers: ${response.status}` },
        { status: response.status }
      );
    }

    const customers = await response.json();
    return NextResponse.json(customers);
    
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const apiEnv = getApiEnvironmentFromRequest(request);
  
  try {
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials();
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
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
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errorText = await response.text();
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

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error(`❌ Failed to create customer:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 500 }
    );
  }
}

