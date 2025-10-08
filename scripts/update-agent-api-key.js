#!/usr/bin/env node

/**
 * Update Agent API Key in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nfkshvmqqgosvcwztqyq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyODg4MiwiZXhwIjoyMDcwNjA0ODgyfQ.p3xQ3EQ-aNnu0d2LjA1yAykD3HryhOQobgWpcqw6dJ4';

// Correct Claude API key from environment
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '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';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateAPIKey() {
  console.log('🔑 Updating Flora AI Assistant API Key in Supabase\n');
  
  try {
    // Get the Flora AI Assistant agent
    const { data: agents, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .ilike('name', '%Flora AI%')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw new Error(`Error fetching agent: ${fetchError.message}`);
    }
    
    if (!agents || agents.length === 0) {
      throw new Error('No Flora AI Assistant found');
    }
    
    const agent = agents[0];
    console.log(`Found agent: ${agent.name} (ID: ${agent.id})`);
    console.log(`Current API key: ${agent.settings?.api_key?.substring(0, 20)}...`);
    console.log(`New API key: ${CLAUDE_API_KEY.substring(0, 20)}...\n`);
    
    // Update the settings with the new API key
    const updatedSettings = {
      ...agent.settings,
      api_key: CLAUDE_API_KEY,
    };
    
    const { data: updated, error: updateError } = await supabase
      .from('ai_agents')
      .update({ settings: updatedSettings })
      .eq('id', agent.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Error updating agent: ${updateError.message}`);
    }
    
    console.log('✅ API key updated successfully!\n');
    console.log('Updated agent:', {
      id: updated.id,
      name: updated.name,
      api_key: updated.settings?.api_key?.substring(0, 20) + '...',
    });
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

updateAPIKey();

