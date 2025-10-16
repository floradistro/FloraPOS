import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com';
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Validate credentials
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('❌ Missing WooCommerce credentials for Cash Management API');
      return NextResponse.json(
        { success: false, error: 'Missing API credentials' },
        { status: 500 }
      );
    }

    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Build the API URL
    const apiUrl = new URL(`${WORDPRESS_API_URL}/wp-json/flora-im/v1/cash/${path}`);
    
    // Add authentication as query params (like other Flora-IM endpoints)
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    // Forward query parameters
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });
    
    console.log('💰 Cash Management API GET:', apiUrl.toString().replace(CONSUMER_SECRET, '***'));
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Cash Management API GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Validate credentials
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('❌ Missing WooCommerce credentials for Cash Management API');
      return NextResponse.json(
        { success: false, error: 'Missing API credentials' },
        { status: 500 }
      );
    }

    const path = params.path.join('/');
    const body = await request.json();
    
    // Build the API URL
    const apiUrl = new URL(`${WORDPRESS_API_URL}/wp-json/flora-im/v1/cash/${path}`);
    
    // Add authentication as query params (like other Flora-IM endpoints)
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('💰 Cash Management API POST:', apiUrl.toString().replace(CONSUMER_SECRET, '***'), body);
    
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Cash Management API POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

