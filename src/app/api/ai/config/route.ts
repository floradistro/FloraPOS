import { NextRequest, NextResponse } from 'next/server';
import { aiAgentService } from '@/services/ai-agent-service';

export const runtime = 'edge';

/**
 * Agent Configuration API
 * Fetches agent config from Supabase and exposes it to frontend
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching active agent from Supabase...');

    // Fetch agent from Supabase
    const agent = await aiAgentService.getActiveAgent();

    if (!agent) {
      console.error('❌ No active agent found in Supabase');
      throw new Error('No active agent found');
    }
    
    // Ensure numeric types are properly typed
    const normalizedAgent = {
      ...agent,
      temperature: typeof agent.temperature === 'string' ? parseFloat(agent.temperature) : agent.temperature,
      max_tokens: typeof agent.max_tokens === 'string' ? parseInt(agent.max_tokens) : agent.max_tokens,
    };
    
    console.log('✅ Agent config fetched from Supabase:', {
      id: normalizedAgent.id,
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
    console.error('❌ Error fetching agent config from Supabase:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { agentId, updates } = await request.json();

    console.log('📝 Updating agent config in Supabase:', agentId, updates);

    const updatedAgent = await aiAgentService.updateAgent(agentId, updates);

    if (!updatedAgent) {
      throw new Error('Failed to update agent');
    }

    return NextResponse.json({
      success: true,
      agent: updatedAgent,
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

