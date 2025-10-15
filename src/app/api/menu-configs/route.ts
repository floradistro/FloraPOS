import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/menu-configs
 * Get all menu configs from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('location_id');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('menu_configs')
      .select('*')
      .order('display_order', { ascending: true });

    if (locationId) {
      query = query.or(`location_id.eq.${locationId},location_id.is.null`);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching menu configs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error in menu-configs GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu-configs
 * Create a new menu config
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📝 Creating menu config:', {
      name: body.name,
      config_type: body.config_type,
      location_id: body.location_id
    });

    const { data, error } = await supabase
      .from('menu_configs')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating menu config:', error);
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log('✅ Menu config created successfully:', data.id);
    return NextResponse.json({
      success: true,
      data,
      message: 'Menu config created successfully'
    });
  } catch (error) {
    console.error('❌ Error in menu-configs POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


