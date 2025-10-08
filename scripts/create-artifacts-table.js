#!/usr/bin/env node

/**
 * Create AI Artifacts Table in Supabase
 * Run this to create the artifacts table in production
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nfkshvmqqgosvcwztqyq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyODg4MiwiZXhwIjoyMDcwNjA0ODgyfQ.p3xQ3EQ-aNnu0d2LjA1yAykD3HryhOQobgWpcqw6dJ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkIfTableExists() {
  try {
    const { data, error } = await supabase
      .from('ai_artifacts')
      .select('id')
      .limit(1);
    
    if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Creating AI Artifacts Table in Supabase');
  console.log('==========================================\n');
  
  try {
    const exists = await checkIfTableExists();
    
    if (exists) {
      console.log('✅ ai_artifacts table already exists!');
      console.log('\nYou can now save artifacts from the AI chat.');
      return;
    }
    
    console.log('📋 Table does not exist. Creating now...\n');
    console.log('⚠️  Note: Due to Supabase limitations, you need to manually run the SQL.');
    console.log('\n📝 Instructions:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/nfkshvmqqgosvcwztqyq/sql/new');
    console.log('   2. Open file: supabase/migrations/20251008000002_create_artifacts_table.sql');
    console.log('   3. Copy the SQL content');
    console.log('   4. Paste into Supabase SQL Editor');
    console.log('   5. Click "Run"');
    console.log('\n💡 This only needs to be done once!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

