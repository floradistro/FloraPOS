import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/menu-configs/migrate
 * Create menu_configs table if it doesn't exist
 */
export async function POST() {
  try {
    console.log('🔧 Creating menu_configs tables...');

    // Create menu_configs table
    const { error: configsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS menu_configs (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          location_id INTEGER,
          config_data JSONB NOT NULL,
          config_type TEXT CHECK (config_type IN ('layout', 'theme')),
          is_active BOOLEAN DEFAULT false,
          is_template BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 0,
          version INTEGER DEFAULT 1,
          parent_version_id BIGINT REFERENCES menu_configs(id) ON DELETE SET NULL,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_menu_configs_location ON menu_configs(location_id);
        CREATE INDEX IF NOT EXISTS idx_menu_configs_active ON menu_configs(is_active);
        CREATE INDEX IF NOT EXISTS idx_menu_configs_template ON menu_configs(is_template);
        CREATE INDEX IF NOT EXISTS idx_menu_configs_type ON menu_configs(config_type);
      `
    });

    if (configsError) {
      // Try alternative approach - direct table check
      const { data, error: checkError } = await supabase
        .from('menu_configs')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        // Table doesn't exist
        return NextResponse.json({
          success: false,
          error: 'menu_configs table does not exist. Please run Supabase migrations manually.',
          hint: 'Run: supabase db push in your terminal'
        }, { status: 500 });
      }
      
      // Table exists
      return NextResponse.json({
        success: true,
        message: 'menu_configs table already exists',
        tableExists: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'menu_configs table created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Table may already exist or you need to run migrations manually'
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

