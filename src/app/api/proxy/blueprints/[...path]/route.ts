import { NextRequest, NextResponse } from 'next/server';

/**
 * WIPED: BluePrints pricing routes completely disabled
 * All pricing/quantity/grams selector routes have been removed
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  console.log('🚫 BluePrints pricing route disabled - path:', params.path.join('/'));
  
  return NextResponse.json({
    success: false,
    error: 'Pricing routes have been disabled',
    message: 'All BluePrints pricing/quantity/grams selector routes have been wiped',
    data: []
  }, { status: 410 }); // 410 Gone - resource no longer available
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  console.log('🚫 BluePrints pricing POST route disabled - path:', params.path.join('/'));
  
  return NextResponse.json({
    success: false,
    error: 'Pricing routes have been disabled',
    message: 'All BluePrints pricing/quantity/grams selector routes have been wiped',
    data: {}
  }, { status: 410 }); // 410 Gone - resource no longer available
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
