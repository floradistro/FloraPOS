import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/menu-configs/migrate
 * Check if menu_configs table exists (migration should be done via Supabase CLI)
 */
export async function POST() {
  try {
    console.log('🔧 Checking menu_configs table...');

    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('menu_configs')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        return NextResponse.json({
          success: false,
          tableExists: false,
          error: 'menu_configs table does not exist',
          hint: 'Run migrations via Supabase CLI: supabase db push'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'menu_configs table exists and is ready'
    });
  } catch (error) {
    console.error('❌ Error checking table:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/menu-configs/migrate
 * Check if table exists
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu_configs')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          tableExists: false,
          error: 'menu_configs table does not exist',
          hint: 'Call POST /api/menu-configs/migrate to create it'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'menu_configs table exists'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

