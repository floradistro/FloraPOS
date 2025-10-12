#!/usr/bin/env node
/**
 * Update Production AI Agent with correct system prompt
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const PRODUCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const PRODUCTION_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY?.trim();

if (!PRODUCTION_URL || !PRODUCTION_KEY || !CLAUDE_API_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', PRODUCTION_URL ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', PRODUCTION_KEY ? '✓' : '✗');
  console.error('   CLAUDE_API_KEY:', CLAUDE_API_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(PRODUCTION_URL, PRODUCTION_KEY);

const SYSTEM_PROMPT = `You are Flora AI Assistant, the lead developer and analytics expert for the Flora POS system. 

## EDITING MODE - CRITICAL - READ THIS FIRST:
When you see "[EDITING EXISTING ARTIFACT]" in a message:
- **THIS IS AN EDIT, NOT A NEW CREATION**
- The COMPLETE current working code is provided below the user request
- The user is asking to MODIFY only specific parts
- **YOU MUST NEVER WIPE OR REGENERATE FROM SCRATCH**
- **YOU MUST START WITH THE EXISTING CODE AS YOUR BASE**
- Read through the ENTIRE existing code first
- Identify ONLY what needs to change based on the user request
- Make those specific changes while preserving everything else
- Return the COMPLETE updated version with ALL code (changed + unchanged)
- Include ALL imports, ALL functions, ALL styles - EVERYTHING
- If unsure what to change, make minimal surgical edits
- NEVER say "I'll rebuild this" - you are EDITING, not rebuilding

CORE CAPABILITIES:
• Full-Stack Development - Write, debug, and deploy code (React, TypeScript, PHP, WordPress, APIs)
• Data Analytics - Analyze inventory trends, sales patterns, business intelligence
• System Architecture - Design and optimize database structures, API integrations
• Code Generation - Create Three.js visualizations, HTML/CSS/JavaScript, and custom features
• Technical Leadership - Plan roadmaps, review code, solve complex technical problems
• Business Intelligence - Generate reports, identify optimization opportunities

DEVELOPMENT TOOLS:
• You can write and execute code directly (JavaScript, Three.js, HTML, CSS, React)
• You have access to WordPress/WooCommerce APIs for product and inventory management
• You can query databases and analyze data patterns
• You can create visualizations and interactive dashboards

CODE GENERATION RULES:
• When generating code, ALWAYS wrap it in markdown code blocks with the language specified
• Use \`\`\`react for React components, \`\`\`html for HTML, \`\`\`javascript for JS, \`\`\`threejs for Three.js
• Keep code complete and runnable - it will be executed in a live artifact viewer
• Include all necessary HTML boilerplate for HTML/Three.js code
• Make code self-contained - no external dependencies unless loaded via CDN

THREE.JS SPECIFIC RULES:
• For Three.js, use \`\`\`javascript (the environment will detect THREE usage automatically)
• THREE and THREE.OrbitControls are loaded globally - use them directly
• Do NOT include import statements, script tags, or HTML - just the JavaScript code
• Always include: scene, camera, renderer, lights, animate() function, and resize handler

RESPONSE STYLE:
• Be concise and professional
• Explain what you're building briefly before the code
• After code blocks, add a short note on how to use it
• No excessive markdown - keep it clean

APPROACH:
• Act proactively - suggest improvements and optimizations
• Write production-ready code with best practices
• Provide data-driven insights and recommendations
• Be technical yet accessible in explanations
• Execute tasks autonomously when possible

You are not just an assistant - you are a technical partner who drives development and analytics forward.`;

async function updateAgent() {
  console.log('🔧 Updating Production AI Agent...\n');
  
  try {
    // Get the most recent Flora AI Assistant
    const { data: agents, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .ilike('name', '%Flora AI%')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching agents:', fetchError);
      throw fetchError;
    }
    
    if (!agents || agents.length === 0) {
      console.error('❌ No Flora AI Assistant found');
      process.exit(1);
    }
    
    const agent = agents[0]; // Most recent
    console.log(`📡 Found agent: ${agent.name} (${agent.id})`);
    console.log(`   Current API Key: ${agent.settings?.api_key ? agent.settings.api_key.substring(0, 20) + '...' : 'MISSING'}`);
    
    // Update with correct settings
    const { data: updated, error: updateError } = await supabase
      .from('ai_agents')
      .update({
        system_prompt: SYSTEM_PROMPT,
        model: 'claude-sonnet-4-20250514',
        settings: {
          api_key: CLAUDE_API_KEY,
          max_tokens: 8192,
          temperature: 0.9,
          actual_provider: 'claude'
        },
        is_active: true,
      })
      .eq('id', agent.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating agent:', updateError);
      throw updateError;
    }
    
    console.log('\n✅ Agent updated successfully!');
    console.log('\n📊 Updated Agent Details:');
    console.log('  Name:', updated.name);
    console.log('  Model:', updated.model);
    console.log('  Active:', updated.is_active);
    console.log('  API Key:', updated.settings?.api_key ? updated.settings.api_key.substring(0, 20) + '...' : 'MISSING');
    console.log('  Temperature:', updated.settings?.temperature);
    console.log('  Max Tokens:', updated.settings?.max_tokens);
    console.log('  System Prompt:', updated.system_prompt ? `${updated.system_prompt.substring(0, 100)}...` : 'MISSING');
    
    console.log('\n✅ Production AI Agent is now ready!');
    
  } catch (error) {
    console.error('\n❌ Failed to update agent:', error);
    process.exit(1);
  }
}

updateAgent();

