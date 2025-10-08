/**
 * AI Agent Service
 * Manages AI agent configuration and operations using Supabase
 * 
 * Note: Adapts to existing Supabase schema with settings JSON field
 */

import { supabase } from '@/lib/supabase';

// Type definitions matching existing Supabase schema
export type AIAgent = {
  id: string;
  name: string;
  provider: string;
  model: string;
  tier?: string;
  description?: string;
  system_prompt: string | null;
  capabilities?: any[];
  settings?: {
    temperature?: number;
    max_tokens?: number;
    api_key?: string;
    actual_provider?: string;
  };
  is_active?: boolean;
  has_web_search?: boolean;
  created_at?: string;
  updated_at?: string;
  // Normalized fields for compatibility
  temperature: number;
  max_tokens: number;
  api_key: string;
  status: string;
};

// For conversation and message types (these tables don't exist yet)
export type AIConversation = {
  id: string;
  user_id: string;
  agent_id: string;
  title?: string;
  context?: any;
  status: string;
  message_count: number;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
};

export type AIMessage = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens_used?: number;
  model_version?: string;
  metadata?: any;
  created_at?: string;
};

/**
 * AI Agent Service Class
 */
class AIAgentService {
  /**
   * Normalize agent data from Supabase schema to expected format
   */
  private normalizeAgent(data: any): AIAgent {
    return {
      ...data,
      // Extract settings from JSON field
      temperature: data.settings?.temperature ?? 0.9,
      max_tokens: data.settings?.max_tokens ?? 8192,
      api_key: data.settings?.api_key ?? process.env.CLAUDE_API_KEY ?? '',
      status: data.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Get active agent
   * Returns the most recently created active Flora AI Assistant
   */
  async getActiveAgent(): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .ilike('name', '%Flora AI%') // Get Flora AI Assistant
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching active agent:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ No active Flora AI agent found');
        return null;
      }

      const agent = this.normalizeAgent(data);

      console.log('✅ Active agent loaded from Supabase:', {
        name: agent.name,
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
      });

      return agent;
    } catch (error) {
      console.error('❌ Exception fetching active agent:', error);
      return null;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('❌ Error fetching agent:', error);
        return null;
      }

      return this.normalizeAgent(data);
    } catch (error) {
      console.error('❌ Exception fetching agent:', error);
      return null;
    }
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching agents:', error);
        return [];
      }

      return (data || []).map(agent => this.normalizeAgent(agent));
    } catch (error) {
      console.error('❌ Exception fetching agents:', error);
      return [];
    }
  }

  /**
   * Create new agent
   */
  async createAgent(agentData: any): Promise<AIAgent | null> {
    try {
      // Adapt data to existing schema
      const supabaseData = {
        name: agentData.name,
        provider: 'openai', // Schema constraint
        model: agentData.model,
        system_prompt: agentData.system_prompt,
        tier: agentData.tier || 'enterprise',
        description: agentData.description,
        settings: {
          temperature: agentData.temperature,
          max_tokens: agentData.max_tokens,
          api_key: agentData.api_key,
        },
        capabilities: agentData.capabilities || [],
        is_active: true,
        has_web_search: false,
      };

      const { data, error } = await supabase
        .from('ai_agents')
        .insert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating agent:', error);
        return null;
      }

      console.log('✅ Agent created:', data.name);
      return this.normalizeAgent(data);
    } catch (error) {
      console.error('❌ Exception creating agent:', error);
      return null;
    }
  }

  /**
   * Update agent
   */
  async updateAgent(agentId: string, updates: any): Promise<AIAgent | null> {
    try {
      // First get current agent to merge settings
      const current = await this.getAgentById(agentId);
      if (!current) {
        throw new Error('Agent not found');
      }

      // Adapt updates to existing schema
      const supabaseUpdates: any = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.model) supabaseUpdates.model = updates.model;
      if (updates.system_prompt !== undefined) supabaseUpdates.system_prompt = updates.system_prompt;
      
      // Merge settings
      if (updates.temperature !== undefined || updates.max_tokens !== undefined || updates.api_key !== undefined) {
        supabaseUpdates.settings = {
          ...(current.settings || {}),
          ...(updates.temperature !== undefined && { temperature: updates.temperature }),
          ...(updates.max_tokens !== undefined && { max_tokens: updates.max_tokens }),
          ...(updates.api_key !== undefined && { api_key: updates.api_key }),
        };
      }

      if (updates.status !== undefined) {
        supabaseUpdates.is_active = updates.status === 'active';
      }

      const { data, error } = await supabase
        .from('ai_agents')
        .update(supabaseUpdates)
        .eq('id', agentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating agent:', error);
        return null;
      }

      console.log('✅ Agent updated:', data.name);
      return this.normalizeAgent(data);
    } catch (error) {
      console.error('❌ Exception updating agent:', error);
      return null;
    }
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) {
        console.error('❌ Error deleting agent:', error);
        return false;
      }

      console.log('✅ Agent deleted');
      return true;
    } catch (error) {
      console.error('❌ Exception deleting agent:', error);
      return false;
    }
  }

  /**
   * Get or create conversation for user
   */
  async getOrCreateConversation(userId: string, agentId: string): Promise<AIConversation | null> {
    try {
      // Try to get most recent active conversation
      const { data: existing, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching conversation:', fetchError);
      }

      if (existing) {
        console.log('✅ Using existing conversation:', existing.id);
        return existing;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          agent_id: agentId,
          title: `Conversation ${new Date().toLocaleString()}`,
          status: 'active',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating conversation:', createError);
        return null;
      }

      console.log('✅ New conversation created:', newConversation.id);
      return newConversation;
    } catch (error) {
      console.error('❌ Exception in getOrCreateConversation:', error);
      return null;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string): Promise<AIConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('❌ Error fetching conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Exception fetching conversation:', error);
      return null;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, limit: number = 10): Promise<AIConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching user conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching user conversations:', error);
      return [];
    }
  }

  /**
   * Update conversation
   */
  async updateConversation(conversationId: string, updates: UpdateConversationData): Promise<AIConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Exception updating conversation:', error);
      return null;
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Error archiving conversation:', error);
        return false;
      }

      console.log('✅ Conversation archived');
      return true;
    } catch (error) {
      console.error('❌ Exception archiving conversation:', error);
      return false;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(messageData: CreateMessageData): Promise<AIMessage | null> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Exception adding message:', error);
      return null;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, limit: number = 50): Promise<AIMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching messages:', error);
      return [];
    }
  }

  /**
   * Get conversation history for Claude API
   * Formats messages in Claude's expected format
   */
  async getConversationHistory(conversationId: string, limit: number = 20): Promise<Array<{ role: string; content: string }>> {
    try {
      const messages = await this.getConversationMessages(conversationId, limit);
      
      // Filter out 'thinking' messages and format for Claude
      return messages
        .filter(msg => msg.role !== 'thinking' && msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }));
    } catch (error) {
      console.error('❌ Exception getting conversation history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();

// Export class for testing
export default AIAgentService;

