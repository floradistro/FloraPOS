#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nfkshvmqqgosvcwztqyq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyODg4MiwiZXhwIjoyMDcwNjA0ODgyfQ.p3xQ3EQ-aNnu0d2LjA1yAykD3HryhOQobgWpcqw6dJ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTable() {
  console.log('🚀 Creating ai_artifacts table in PRODUCTION Supabase\n');
  
  try {
    // Test if table exists
    const { data: existing, error: testError } = await supabase
      .from('ai_artifacts')
      .select('id')
      .limit(1);
    
    if (testError && (testError.code === 'PGRST116' || testError.message.includes('does not exist'))) {
      console.log('❌ Table does not exist. You need to create it manually.\n');
      console.log('📋 Instructions:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/nfkshvmqqgosvcwztqyq/sql/new');
      console.log('   2. Copy SQL from: supabase/migrations/20251008000002_create_artifacts_table.sql');
      console.log('   3. Paste and click "Run"');
      console.log('   4. Table will be created!');
      return;
    }
    
    console.log('✅ ai_artifacts table already exists!');
    
    if (existing && existing.length > 0) {
      console.log(`   Found ${existing.length} existing artifacts`);
    } else {
      console.log('   Table is empty - ready to save artifacts!');
    }
    
    console.log('\n✅ Production Supabase is ready for artifact saving!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTable();

