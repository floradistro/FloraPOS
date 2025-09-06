import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    console.log('🔄 Fetching pricing rules from Flora API');

    // Build the API URL for pricing rules
    let url = `${FLORA_API_URL}/wp-json/fd/v1/pricing-rules?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    
    if (productId) {
      url += `&product_id=${productId}`;
    }
    
    if (activeOnly) {
      url += `&active_only=true`;
    }

    // Add cache busting
    url += `&_t=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'POSV1/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('❌ Flora pricing rules API error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: 'Pricing rules API unavailable',
        rules: [],
        count: 0
      }, { status: response.status });
    }

    const result = await response.json();
    
    console.log('✅ Pricing rules fetched successfully');

    // Handle different response formats
    if (result.rules && Array.isArray(result.rules)) {
      return NextResponse.json({
        rules: result.rules,
        count: result.count || result.rules.length
      });
    } else if (Array.isArray(result)) {
      return NextResponse.json({
        rules: result,
        count: result.length
      });
    } else {
      return NextResponse.json({
        rules: [],
        count: 0
      });
    }

  } catch (error) {
    console.error('❌ Pricing rules API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Pricing rules API error',
      rules: [],
      count: 0
    }, { status: 500 });
  }
}