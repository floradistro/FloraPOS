import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl as getBaseUrl, getApiCredentials } from '@/lib/server-api-config';

export const dynamic = 'force-dynamic';

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

function getApiBaseUrl(request: NextRequest): string {
  const apiEnv = getApiEnvironmentFromRequest(request);
  return `${getBaseUrl(apiEnv)}/wp-json`;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Fetching categories from WooCommerce...');
    
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('❌ Missing WooCommerce credentials');
      return NextResponse.json(
        { error: 'Missing WooCommerce credentials in environment variables' },
        { status: 500 }
      );
    }

    const FLORA_API_BASE = getApiBaseUrl(request);
    
    // Build the API URL for categories
    const apiUrl = new URL(`${FLORA_API_BASE}/wc/v3/products/categories`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    apiUrl.searchParams.append('per_page', '100');
    apiUrl.searchParams.append('hide_empty', 'false');
    
    console.log('🔗 Fetching from:', apiUrl.toString().replace(/consumer_(key|secret)=[^&]*/g, 'consumer_$1=***'));
    
    // Fetch categories from WooCommerce
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WooCommerce API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch categories from WooCommerce' },
        { status: response.status }
      );
    }

    const wcCategories = await response.json();
    console.log('✅ Fetched categories from WooCommerce:', wcCategories.length);

    // Transform to our format
    const categories: Category[] = wcCategories
      .filter((cat: any) => cat.count > 0) // Only include categories with products
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count || 0,
      }))
      .sort((a: Category, b: Category) => b.count - a.count); // Sort by count descending

    console.log('✅ Returning', categories.length, 'categories with products');

    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
}

