#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nfkshvmqqgosvcwztqyq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyODg4MiwiZXhwIjoyMDcwNjA0ODgyfQ.p3xQ3EQ-aNnu0d2LjA1yAykD3HryhOQobgWpcqw6dJ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listArtifacts() {
  console.log('📋 All Artifacts in Supabase:\n');
  
  const { data, error } = await supabase
    .from('ai_artifacts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No artifacts found');
    return;
  }
  
  data.forEach((artifact, index) => {
    console.log(`${index + 1}. ${artifact.title}`);
    console.log(`   ID: ${artifact.id}`);
    console.log(`   Created by: ${artifact.created_by}`);
    console.log(`   Language: ${artifact.language}`);
    console.log(`   Type: ${artifact.artifact_type}`);
    console.log(`   Visibility: ${artifact.is_global ? '🌐 Global' : '🔒 Personal'}`);
    console.log(`   Code length: ${artifact.code.length} chars`);
    console.log(`   Created: ${artifact.created_at}`);
    console.log('');
  });
  
  console.log(`Total: ${data.length} artifacts`);
}

listArtifacts();

