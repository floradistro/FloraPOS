import { NextRequest, NextResponse } from 'next/server';
import { ApiConfig } from '@/lib/api-config';

export const runtime = 'edge';

/**
 * Agent Configuration API
 * Fetches agent config from WordPress and exposes it to frontend
 */
export async function GET(request: NextRequest) {
  try {
    const apiEnv = request.headers.get('x-api-environment') || 'production';
    const wpBaseUrl = ApiConfig.getBaseUrl();
    const credentials = ApiConfig.getCredentials();


    // Fetch agent from WordPress
    const response = await fetch(
      `${wpBaseUrl}/wp-json/flora-im/v1/ai/agents/active?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('❌ Failed to fetch agent from WordPress:', response.status);
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();
    
    // WordPress already wraps in {success, agent}, so extract agent
    const agent = data.agent || data;
    
    // Convert string values to numbers for Claude API compatibility
    const normalizedAgent = {
      ...agent,
      temperature: parseFloat(agent.temperature),
      max_tokens: parseInt(agent.max_tokens),
    };
    
    console.log('✅ Agent config fetched:', {
      name: normalizedAgent.name,
      model: normalizedAgent.model,
      temperature: normalizedAgent.temperature,
      max_tokens: normalizedAgent.max_tokens,
    });

    return NextResponse.json({
      success: true,
      agent: normalizedAgent,
    });
  } catch (error) {
    console.error('❌ Error fetching agent config:', error);
    
    // Return default config as fallback
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      agent: {
        id: 1,
        name: 'Flora AI Assistant',
        provider: 'claude',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.9,
        max_tokens: 8192,
        system_prompt: 'You are Flora AI Assistant, a helpful AI for Flora POS.',
        status: 'active',
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { agentId, updates } = await request.json();
    const wpBaseUrl = ApiConfig.getBaseUrl();
    const credentials = ApiConfig.getCredentials();

    console.log('📝 Updating agent config:', agentId, updates);

    const response = await fetch(
      `${wpBaseUrl}/wp-json/flora-im/v1/ai/agents/${agentId}?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      agent: data,
    });
  } catch (error) {
    console.error('❌ Error updating agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

