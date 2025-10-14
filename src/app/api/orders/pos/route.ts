import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api-fetch';

/**
 * Fast POS Orders Endpoint
 * Uses flora-im bulk orders API instead of slow WooCommerce API
 * 10x faster, smaller payloads
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const locationId = searchParams.get('location_id');
    const customerId = searchParams.get('customer');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status') || 'any';
    
    // Build query params for bulk endpoint
    const bulkParams = new URLSearchParams({
      page,
      per_page: perPage,
      status
    });
    
    if (locationId) {
      bulkParams.append('location_id', locationId);
    }
    
    if (customerId) {
      bulkParams.append('customer_id', customerId);
    }
    
    if (dateFrom) {
      bulkParams.append('date_from', dateFrom);
    }
    
    if (dateTo) {
      bulkParams.append('date_to', dateTo);
    }
    
    // Use bulk orders endpoint - much faster than WooCommerce API
    const response = await apiFetch(
      `/api/proxy/flora-im/orders/bulk?${bulkParams.toString()}`,
      {
        headers: request.headers
      }
    );
    
    if (!response.ok) {
      throw new Error(`Bulk orders API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('POS orders endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        data: [],
        meta: { total: 0, pages: 1, page: 1, per_page: 20 }
      },
      { status: 500 }
    );
  }
}

