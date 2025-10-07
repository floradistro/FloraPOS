import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Fetching user...`);
    
    const userId = params.id;
    
    // Fetch user data from WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${userId}`;
    const apiParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${url}?${apiParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Updating user...`);
    
    const userId = params.id;
    const body = await request.json();
    
    // Update user via WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${userId}`;
    const apiParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    });

    const response = await fetch(`${url}?${apiParams.toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update user: ${response.status}`);
    }

    const updatedUser = await response.json();
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Deleting user...`);
    
    const userId = params.id;
    
    console.log(`🗑️ Attempting to delete user ${userId}`);
    
    // Delete user via WooCommerce API
    const url = `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/customers/${userId}`;
    const apiParams = new URLSearchParams({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
      force: 'true', // Force delete to permanently remove the customer
    });

    const response = await fetch(`${url}?${apiParams.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WooCommerce delete error:', errorData);
      throw new Error(errorData.message || `Failed to delete user: ${response.status}`);
    }

    const deletedUser = await response.json();
    console.log(`✅ Successfully deleted user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser 
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
