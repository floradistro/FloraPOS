import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/menu-configs/[id]
 * Get a single menu config by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);

    const { data, error } = await supabase
      .from('menu_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) {
      console.error('❌ Supabase error fetching menu config:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in menu-configs GET [id]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/menu-configs/[id]
 * Update a menu config
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);
    const updates = await request.json();

    const { data, error } = await supabase
      .from('menu_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating menu config:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Menu config updated successfully'
    });
  } catch (error) {
    console.error('❌ Error in menu-configs PUT [id]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu-configs/[id]
 * Delete a menu config
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = parseInt(params.id);

    const { error } = await supabase
      .from('menu_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('❌ Supabase error deleting menu config:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Menu config deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in menu-configs DELETE [id]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

