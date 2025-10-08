import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

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

    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const baseUrl = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials(apiEnv);

    console.log(`🔄 [${apiEnv.toUpperCase()}] Fetching pricing rules for blueprint ${blueprintId} from Flora V2 API`);

    // Build the API URL for general pricing rules (V2 endpoint)
    let url = `${baseUrl}/wp-json/fd/v2/pricing/rules?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`;
    
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