import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const BASE_URL = getApiBaseUrl(apiEnv);
    
    const params = new URLSearchParams({
      consumer_key: credentials.consumerKey,
      consumer_secret: credentials.consumerSecret
    });
    
    console.log('🔄 [Cache API] Purging all caches...');
    
    // 1. Purge SiteGround cache via admin-ajax
    const sgPurgeUrl = `${BASE_URL}/wp-admin/admin-ajax.php?action=sg_cachepress_purge&consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`;
    await fetch(sgPurgeUrl, { signal: AbortSignal.timeout(3000) }).catch(() => {});
    
    // 2. Trigger WordPress cache flush
    const wpFlushUrl = `${BASE_URL}/wp-json/flora-im/v1/orders?${params.toString()}&per_page=1&_flush=${Date.now()}`;
    await fetch(wpFlushUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: AbortSignal.timeout(3000)
    }).catch(() => {});
    
    console.log('✅ [Cache API] All caches purged');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Cache API] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

