import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

interface AuditLogEntry {
  id?: string | number;
  location_id?: string | number;
  action?: string;
  created_at?: string;
  user_id?: string | number;
  user_name?: string;
  details?: string;
  metadata?: any;
}

const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

export async function GET(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const floraApiBase = 'https://api.floradistro.com';
    const FLORA_API_BASE = `${floraApiBase}/wp-json`;
    console.log(`🔄 [${apiEnv.toUpperCase()}] Fetching audit logs...`);
    
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const locationId = searchParams.get('location_id');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const action = searchParams.get('action') || '';
    const days = searchParams.get('days') || '7';

    if (!locationId) {
      return NextResponse.json(
        { error: 'location_id is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching audit log for location ${locationId}, limit: ${limit}, offset: ${offset}`);

    // Fetch MORE entries from Flora IM to account for filtering
    // We need to fetch more because we filter client-side
    const fetchLimit = '500'; // Fetch 500 entries to ensure we have enough after filtering
    const fetchOffset = '0'; // Always start from beginning and filter/paginate client-side
    
    // Build the Flora IM audit endpoint URL
    const auditParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      limit: fetchLimit,
      offset: fetchOffset
    });

    const auditUrl = `${FLORA_API_BASE}/flora-im/v1/audit?${auditParams}`;
    
    console.log(`🔗 Calling Flora IM audit endpoint: ${auditUrl}`);

    const response = await fetch(auditUrl + `&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store' // Disable fetch caching
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Flora IM audit API error: ${response.status} - ${errorText}`);
      
      // If it's a 404, the audit endpoint might not exist yet
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: 'Audit log endpoint not available. This feature requires Flora IM plugin with audit log support.'
        });
      }
      
      throw new Error(`Flora IM API error: ${response.status}`);
    }

    const auditData: AuditLogEntry[] = await response.json();
    console.log(`✅ Retrieved ${auditData?.length || 0} audit log entries from Flora IM`);
    
    // Debug: Log first few entries to check timestamps and action types
    if (auditData && auditData.length > 0) {
      console.log('🕐 Sample timestamps from Flora IM:', auditData.slice(0, 3).map(entry => ({
        id: entry.id,
        created_at: entry.created_at,
        created_at_type: typeof entry.created_at,
        parsed: entry.created_at ? new Date(entry.created_at).toISOString() : 'null',
        year: entry.created_at ? new Date(entry.created_at).getFullYear() : 'null'
      })));
      
      console.log('🏷️ Sample action/details from Flora IM:', auditData.slice(0, 5).map(entry => ({
        id: entry.id,
        action: entry.action,
        details: entry.details,
        object_type: (entry as any).object_type,
        user_name: (entry as any).user_name,
        quantity_change: (entry as any).quantity_change,
        old_quantity: (entry as any).old_quantity,
        new_quantity: (entry as any).new_quantity
      })));
      
      // Log full structure of first entry
      console.log('📦 Full structure of first entry:', JSON.stringify(auditData[0], null, 2));
    }

    // Flora IM returns an array directly, not wrapped in a data object
    let filteredData: AuditLogEntry[] = auditData || [];

    // Apply client-side filtering since Flora IM doesn't support it
    // Each location ONLY sees its own inventory movements
    if (locationId && locationId !== 'all') {
      const targetLocationId = parseInt(locationId);
      filteredData = filteredData.filter((entry: AuditLogEntry) => {
        // Simple filter - only show entries where location_id matches
        return entry.location_id && parseInt(entry.location_id.toString()) === targetLocationId;
      });
      console.log(`📍 After location filter (showing only location ${locationId} movements): ${filteredData.length} entries`);
    }

    if (action && action !== 'all' && action !== '') {
      filteredData = filteredData.filter((entry: AuditLogEntry) => 
        entry.action && entry.action === action
      );
      console.log(`🎯 After action filter: ${filteredData.length} entries`);
    }

    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      
      filteredData = filteredData.filter((entry: AuditLogEntry) => {
        if (!entry.created_at) return false;
        const entryDate = new Date(entry.created_at);
        return entryDate >= daysAgo;
      });
      console.log(`📅 After date filter (${days} days): ${filteredData.length} entries`);
    }

    // Apply pagination to filtered data
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    console.log(`📄 Pagination: returning ${paginatedData.length} of ${filteredData.length} total filtered entries (offset: ${offset}, limit: ${limit})`);

    const transformedData = {
      success: true,
      data: paginatedData,
      total: filteredData.length,
      page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      pages: Math.ceil(filteredData.length / parseInt(limit))
    };

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching audit log:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: `Failed to fetch audit log: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
