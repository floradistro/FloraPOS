import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprint_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    if (!blueprintId) {
      return NextResponse.json({
        success: false,
        error: 'blueprint_id is required',
        rules: [],
        count: 0
      }, { status: 400 });
    }

    console.log(`🔄 Fetching pricing rules for blueprint ${blueprintId} from Flora API`);

    // Build the API URL for general pricing rules (no blueprint-specific endpoint exists)
    let url = `${FLORA_API_URL}/wp-json/fd/v1/pricing-rules?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    
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
    
    // Filter rules by blueprint_id from the conditions field
    let filteredRules: any[] = [];
    if (result.rules && Array.isArray(result.rules)) {
      filteredRules = result.rules.filter((rule: any) => {
        try {
          // Parse the conditions JSON to check for blueprint_id
          const conditions = JSON.parse(rule.conditions || '{}');
          const ruleBlueprintId = conditions.blueprint_id;
          
          // Match blueprint ID (convert to number for comparison)
          if (ruleBlueprintId && parseInt(ruleBlueprintId.toString()) === parseInt(blueprintId)) {
            // If activeOnly is specified, filter by status
            if (activeOnly) {
              return rule.status === 'active' && rule.is_active === '1';
            }
            return true;
          }
          return false;
        } catch (e) {
          console.warn('❌ Error parsing rule conditions:', rule.id, e);
          return false;
        }
      });
    }
    
    console.log(`✅ Found ${filteredRules.length} pricing rules for blueprint ${blueprintId}`);

    return NextResponse.json({
      rules: filteredRules,
      count: filteredRules.length
    });

  } catch (error) {
    console.error('❌ Blueprint pricing rules API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Blueprint pricing rules API error',
      rules: [],
      count: 0
    }, { status: 500 });
  }
}