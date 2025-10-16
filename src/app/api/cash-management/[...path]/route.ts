import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${WORDPRESS_API_URL}/wp-json/flora-im/v1/cash/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    console.log('💰 Cash Management API GET:', url);
    
    const response = await fetch(url, {
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
    const path = params.path.join('/');
    const body = await request.json();
    const url = `${WORDPRESS_API_URL}/wp-json/flora-im/v1/cash/${path}`;
    
    console.log('💰 Cash Management API POST:', url, body);
    
    const response = await fetch(url, {
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

