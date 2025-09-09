import { NextRequest, NextResponse } from 'next/server';

interface AuditLogEntry {
  location_id?: string | number;
  action?: string;
  created_at?: string;
  user_id?: string | number;
  user_name?: string;
  details?: string;
  metadata?: any;
}

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest) {
  try {
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

    // Flora IM returns an array directly, not wrapped in a data object
    let filteredData: AuditLogEntry[] = auditData || [];

    // Apply client-side filtering since Flora IM doesn't support it
    if (locationId && locationId !== 'all') {
      filteredData = filteredData.filter((entry: AuditLogEntry) => 
        entry.location_id && entry.location_id.toString() === locationId.toString()
      );
      console.log(`📍 After location filter: ${filteredData.length} entries`);
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
