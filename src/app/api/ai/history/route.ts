import { NextRequest, NextResponse } from 'next/server';
import { ApiConfig } from '@/lib/api-config';

/**
 * Get user ID from request (from localStorage via header)
 */
function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id');
  return userId;
}

/**
 * GET /api/ai/history - Get chat conversation history for current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Call WordPress Magic2 plugin API (use docker/production based on env)
    const env = request.headers.get('x-api-environment') as 'docker' | 'production' || 'docker';
    const wpUrl = env === 'docker' ? process.env.NEXT_PUBLIC_DOCKER_API_URL : process.env.NEXT_PUBLIC_PRODUCTION_API_URL;
    const response = await fetch(`${wpUrl}/wp-json/flora-im/v1/ai/conversations?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      conversations: data.conversations || []
    });

  } catch (error: any) {
    console.error('Error fetching conversation history:', error);
    // Return empty conversations on error (for first-time users)
    return NextResponse.json({
      success: true,
      conversations: []
    });
  }
}

/**
 * POST /api/ai/history - Create new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      console.error('❌ No user ID provided');
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title } = body;


    // Call WordPress Magic2 plugin API to create conversation
    const env = request.headers.get('x-api-environment') as 'docker' | 'production' || 'docker';
    const wpUrl = env === 'docker' ? process.env.NEXT_PUBLIC_DOCKER_API_URL : process.env.NEXT_PUBLIC_PRODUCTION_API_URL;
    
    console.log(`🔗 Making request to: ${wpUrl}/wp-json/flora-im/v1/ai/conversations`);
    
    const response = await fetch(`${wpUrl}/wp-json/flora-im/v1/ai/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        title: title || `Conversation ${new Date().toLocaleDateString()}`
      })
    });

    console.log('📡 WordPress API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WordPress API error:', response.status, errorText);
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Conversation created:', data);

    // Validate response structure
    if (!data.conversation || !data.conversation.id) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from WordPress API - missing conversation data');
    }

    return NextResponse.json({
      success: true,
      conversation: data.conversation
    });

  } catch (error: any) {
    console.error('❌ Error creating conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create conversation' 
      },
      { status: 500 }
    );
  }
}

