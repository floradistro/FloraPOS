import { NextRequest, NextResponse } from 'next/server'

// Flora Distro API Configuration
const FLORA_API_URL = process.env.NEXT_PUBLIC_FLORA_API_URL || 'https://api.floradistro.com'
const FLORA_CONSUMER_KEY = process.env.FLORA_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const FLORA_CONSUMER_SECRET = process.env.FLORA_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// GET customer preferences from Flora API
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params

    console.log('🔍 Fetching preferences for customer:', customerId)

    // First try to get customer from Flora API
    const customerResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/customers/${customerId}`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${FLORA_CONSUMER_KEY}:${FLORA_CONSUMER_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
      }
    )

    if (!customerResponse.ok) {
      console.error('❌ Customer not found in Flora API:', customerResponse.status)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const customerData = await customerResponse.json()
    
    // Extract preferences from customer meta_data (using 'customer_preferences' key)
    let preferences = []
    const preferenceMeta = customerData.meta_data?.find((meta: any) => meta.key === 'customer_preferences')
    
    if (preferenceMeta && preferenceMeta.value) {
      try {
        // Parse JSON string to array
        preferences = typeof preferenceMeta.value === 'string' 
          ? JSON.parse(preferenceMeta.value) 
          : preferenceMeta.value
        preferences = Array.isArray(preferences) ? preferences : []
      } catch (error) {
        console.error('Error parsing preferences JSON:', error)
        preferences = []
      }
    }

    console.log('✅ Successfully fetched preferences:', preferences.length, 'items')

    return NextResponse.json({ 
      preferences: preferences,
      customer: {
        id: customerData.id,
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        phone: customerData.billing?.phone || '',
      }
    })
  } catch (error) {
    console.error('Error fetching customer preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer preferences' },
      { status: 500 }
    )
  }
}

// POST add a single preference to Flora API
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params
    const { category, value, notes } = await request.json()

    console.log('🔍 Adding preference for customer:', customerId, { category, value, notes })

    // First get existing preferences
    const getResponse = await GET(request, { params })
    if (!getResponse.ok) {
      return getResponse
    }
    
    const existingData = await getResponse.json()
    const existingPreferences = existingData.preferences || []

    // Create new preference
    const newPreference = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      value,
      notes: notes || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to existing preferences
    const updatedPreferences = [...existingPreferences, newPreference]

    // Update customer in Flora API
    const updateResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/customers/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${FLORA_CONSUMER_KEY}:${FLORA_CONSUMER_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: 'customer_preferences',
              value: JSON.stringify(updatedPreferences)
            },
            {
              key: 'preferences_updated_at',
              value: new Date().toISOString()
            },
            {
              key: 'preferences_source',
              value: 'pos_frontend'
            }
          ]
        })
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ Flora API error:', updateResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to add customer preference' },
        { status: updateResponse.status }
      )
    }

    console.log('✅ Successfully added preference:', newPreference.id)

    return NextResponse.json({ 
      success: true, 
      preference: newPreference,
      preferences: updatedPreferences
    })
  } catch (error) {
    console.error('Error adding customer preference:', error)
    return NextResponse.json(
      { error: 'Failed to add customer preference' },
      { status: 500 }
    )
  }
}

// PUT update all customer preferences in Flora API
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params
    const { preferences } = await request.json()

    console.log('🔍 Updating preferences for customer:', customerId, preferences?.length || 0, 'items')

    // Update customer in Flora API with new preferences
    const updateResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/customers/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${FLORA_CONSUMER_KEY}:${FLORA_CONSUMER_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: 'customer_preferences',
              value: JSON.stringify(preferences)
            },
            {
              key: 'preferences_updated_at',
              value: new Date().toISOString()
            },
            {
              key: 'preferences_source',
              value: 'pos_frontend'
            }
          ]
        })
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ Flora API error:', updateResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to update customer preferences' },
        { status: updateResponse.status }
      )
    }

    console.log('✅ Successfully updated preferences:', preferences?.length || 0, 'items')

    return NextResponse.json({ 
      success: true, 
      preferences: preferences,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update customer preferences' },
      { status: 500 }
    )
  }
}

// DELETE a specific preference from Flora API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params
    const url = new URL(request.url)
    const preferenceId = url.searchParams.get('preferenceId')

    if (!preferenceId) {
      return NextResponse.json(
        { error: 'Preference ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Deleting preference:', preferenceId, 'for customer:', customerId)

    // Get existing preferences
    const getResponse = await GET(request, { params })
    if (!getResponse.ok) {
      return getResponse
    }
    
    const existingData = await getResponse.json()
    const existingPreferences = existingData.preferences || []

    // Remove the specific preference
    const updatedPreferences = existingPreferences.filter((pref: any) => pref.id !== preferenceId)

    // Update customer in Flora API
    const updateResponse = await fetch(
      `${FLORA_API_URL}/wp-json/wc/v3/customers/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${FLORA_CONSUMER_KEY}:${FLORA_CONSUMER_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: [
            {
              key: 'customer_preferences',
              value: JSON.stringify(updatedPreferences)
            },
            {
              key: 'preferences_updated_at',
              value: new Date().toISOString()
            },
            {
              key: 'preferences_source',
              value: 'pos_frontend'
            }
          ]
        })
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ Flora API error:', updateResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to delete customer preference' },
        { status: updateResponse.status }
      )
    }

    console.log('✅ Successfully deleted preference:', preferenceId)

    return NextResponse.json({ 
      success: true, 
      preferences: updatedPreferences,
      message: 'Preference deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer preference:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer preference' },
      { status: 500 }
    )
  }
} 