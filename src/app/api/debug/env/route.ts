import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Debug endpoint to check environment variables on production
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY ? 'SET' : 'MISSING',
    },
    wordpress: {
      productionUrl: process.env.NEXT_PUBLIC_PRODUCTION_API_URL ? 'SET' : 'MISSING',
      consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY ? 'SET' : 'MISSING',
      consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET ? 'SET' : 'MISSING',
    },
    runtime: 'edge',
    timestamp: new Date().toISOString(),
  });
}

