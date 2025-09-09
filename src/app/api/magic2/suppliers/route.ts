import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This would typically fetch from your suppliers database table
    // For now, returning mock data that matches what magic2 expects
    const suppliers = [
      { id: 1, name: 'Supplier A', company: 'Company A Ltd', is_active: 1 },
      { id: 2, name: 'Supplier B', company: 'Company B Inc', is_active: 1 },
      { id: 3, name: 'Supplier C', company: 'Company C Corp', is_active: 1 },
      { id: 4, name: 'Test Supplier', company: 'Test Company', is_active: 1 },
    ];

    const formattedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      company: supplier.company,
      display_name: supplier.company ? `${supplier.company} (${supplier.name})` : supplier.name
    }));

    return NextResponse.json({
      success: true,
      data: formattedSuppliers
    });

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch suppliers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, company, email, phone, address } = await request.json();

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Supplier name is required'
      }, { status: 400 });
    }

    // This would typically insert into your suppliers database table
    // For now, returning mock response
    const newSupplier = {
      id: Date.now(), // Mock ID
      name,
      company: company || '',
      email: email || '',
      phone: phone || '',
      address: address || '',
      is_active: 1,
      created_at: new Date().toISOString()
    };

    console.log('Creating new supplier:', newSupplier);

    return NextResponse.json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    });

  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create supplier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

