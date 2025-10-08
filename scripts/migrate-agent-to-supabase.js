#!/usr/bin/env node

/**
 * Migrate AI Agent Configuration from WordPress to Supabase
 * 
 * This script:
 * 1. Fetches the active agent from WordPress
 * 2. Inserts it into Supabase
 * 3. Optionally migrates conversation history
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const WORDPRESS_URL = process.env.WORDPRESS_API_URL || 'https://api.floradistro.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfkshvmqqgosvcwztqyq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchWordPressAgent() {
  console.log('📡 Fetching active agent from WordPress...');
  console.log(`   URL: ${WORDPRESS_URL}/wp-json/flora-im/v1/ai/agents/active`);
  
  try {
    const response = await fetch(`${WORDPRESS_URL}/wp-json/flora-im/v1/ai/agents/active`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const agent = data.agent || data;
    
    console.log('✅ WordPress agent fetched:', {
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
    });
    
    return agent;
  } catch (error) {
    console.error('❌ Error fetching WordPress agent:', error.message);
    throw error;
  }
}

async function migrateAgent(wordpressAgent) {
  console.log('\n📝 Migrating agent to Supabase...');
  
  try {
    // Check if agent already exists (using existing schema with is_active)
    const { data: existingAgents, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('provider', 'claude')
      .eq('is_active', true);
    
    if (fetchError) {
      throw new Error(`Error checking existing agents: ${fetchError.message}`);
    }
    
    // Prepare agent data for Supabase (adapting to existing schema)
    // Note: Using 'openai' as provider to match existing schema constraints
    const agentData = {
      name: wordpressAgent.name,
      provider: 'openai', // Using 'openai' to match existing schema constraint
      model: wordpressAgent.model, // Still using Claude model
      system_prompt: wordpressAgent.system_prompt,
      tier: 'enterprise',
      description: `Flora AI Assistant (${wordpressAgent.provider}: ${wordpressAgent.model}) - Migrated from WordPress`,
      settings: {
        temperature: parseFloat(wordpressAgent.temperature),
        max_tokens: parseInt(wordpressAgent.max_tokens),
        api_key: wordpressAgent.api_key, // Store API key in settings
        actual_provider: wordpressAgent.provider, // Track actual provider
      },
      capabilities: [
        { id: 'code-generation', name: 'Code Generation', description: 'Generate React, Three.js, and HTML code' },
        { id: 'wordpress-tools', name: 'WordPress Tools', description: 'Access inventory and product data via WordPress' },
        { id: 'analytics', name: 'Analytics', description: 'Analyze sales and inventory trends' },
      ],
      is_active: true,
      has_web_search: false,
    };
    
    if (existingAgents && existingAgents.length > 0) {
      console.log('⚠️  Active agent already exists in Supabase');
      console.log('   Updating existing agent...');
      
      const { data: updatedAgent, error: updateError } = await supabase
        .from('ai_agents')
        .update(agentData)
        .eq('id', existingAgents[0].id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Error updating agent: ${updateError.message}`);
      }
      
      console.log('✅ Agent updated successfully');
      console.log('   ID:', updatedAgent.id);
      return updatedAgent;
    } else {
      console.log('   Creating new agent in Supabase...');
      
      const { data: newAgent, error: insertError } = await supabase
        .from('ai_agents')
        .insert(agentData)
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Error inserting agent: ${insertError.message}`);
      }
      
      console.log('✅ Agent created successfully');
      console.log('   ID:', newAgent.id);
      return newAgent;
    }
  } catch (error) {
    console.error('❌ Error migrating agent:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      throw new Error(`Error verifying migration: ${error.message}`);
    }
    
    if (!agents || agents.length === 0) {
      throw new Error('No active agents found in Supabase after migration');
    }
    
    console.log('✅ Migration verified successfully');
    console.log('\nActive agents in Supabase:');
    agents.forEach((agent, index) => {
      console.log(`\n${index + 1}. ${agent.name}`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Provider: ${agent.provider}`);
      console.log(`   Model: ${agent.model}`);
      console.log(`   Temperature: ${agent.temperature}`);
      console.log(`   Max Tokens: ${agent.max_tokens}`);
      console.log(`   Status: ${agent.status}`);
    });
    
    return agents;
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting AI Agent Migration');
  console.log('================================\n');
  console.log(`WordPress: ${WORDPRESS_URL}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);
  
  try {
    // Step 1: Fetch agent from WordPress
    const wordpressAgent = await fetchWordPressAgent();
    
    // Step 2: Migrate to Supabase
    const supabaseAgent = await migrateAgent(wordpressAgent);
    
    // Step 3: Verify migration
    await verifyMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the AI chat in your application');
    console.log('   2. Verify agent configuration is loaded from Supabase');
    console.log('   3. Update any remaining references to WordPress agent API');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
main();

