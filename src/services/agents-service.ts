/**
 * Agent Configuration Service
 * Fetches AI agent configuration from WordPress
 */

export interface Agent {
  id: number;
  name: string;
  provider: string;
  model: string;
  api_key: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UpdateAgentData {
  name?: string;
  model?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

class AgentsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
  }

  /**
   * Get the active agent configuration
   */
  async getActiveAgent(): Promise<Agent> {
    const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'staging';
    const apiEnv = typeof window !== 'undefined'
      ? (localStorage.getItem('flora_pos_api_environment') || DEFAULT_ENV)
      : DEFAULT_ENV;

    const response = await fetch(`${this.baseUrl}/api/ai/config`, {
      headers: {
        'x-api-environment': apiEnv,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agent config: ${response.statusText}`);
    }

    const data = await response.json();
    return data.agent;
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: number, updates: UpdateAgentData): Promise<Agent> {
    const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'staging';
    const apiEnv = typeof window !== 'undefined'
      ? (localStorage.getItem('flora_pos_api_environment') || DEFAULT_ENV)
      : DEFAULT_ENV;

    const response = await fetch(`${this.baseUrl}/api/ai/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-environment': apiEnv,
      },
      body: JSON.stringify({ agentId, updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update agent: ${response.statusText}`);
    }

    const data = await response.json();
    return data.agent;
  }
}

export const agentsService = new AgentsService();
