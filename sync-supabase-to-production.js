const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Local Docker Supabase
const local = createClient(
  'http://127.0.0.1:54321',
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
);

// Production Supabase
const prod = createClient(
  'https://nfkshvmqqgosvcwztqyq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyODg4MiwiZXhwIjoyMDcwNjA0ODgyfQ.p3xQ3EQ-aNnu0d2LjA1yAykD3HryhOQobgWpcqw6dJ4'
);

async function syncTable(tableName) {
  console.log(`\n📋 Syncing ${tableName}...`);
  
  // Fetch from local
  const { data: localData, error: fetchError } = await local
    .from(tableName)
    .select('*');
  
  if (fetchError) {
    console.log(`  ⚠️  Error fetching from local: ${fetchError.message}`);
    return;
  }
  
  if (!localData || localData.length === 0) {
    console.log(`  ℹ️  No data in local ${tableName}`);
    return;
  }
  
  console.log(`  📥 Found ${localData.length} records in local`);
  
  // Backup to file
  const backupFile = `supabase-backup-${tableName}.json`;
  fs.writeFileSync(backupFile, JSON.stringify(localData, null, 2));
  console.log(`  💾 Backed up to ${backupFile}`);
  
  // Clear production table first (optional - comment out if you want to keep existing data)
  const { error: deleteError } = await prod
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.log(`  ⚠️  Could not clear production table: ${deleteError.message}`);
  } else {
    console.log(`  🗑️  Cleared production table`);
  }
  
  // Insert into production
  const { data: inserted, error: insertError } = await prod
    .from(tableName)
    .insert(localData);
  
  if (insertError) {
    console.log(`  ❌ Error inserting to production: ${insertError.message}`);
    
    // Try upsert instead
    console.log(`  🔄 Trying upsert...`);
    const { data: upserted, error: upsertError } = await prod
      .from(tableName)
      .upsert(localData, { onConflict: 'id' });
    
    if (upsertError) {
      console.log(`  ❌ Upsert also failed: ${upsertError.message}`);
    } else {
      console.log(`  ✅ Synced ${localData.length} records via upsert`);
    }
  } else {
    console.log(`  ✅ Synced ${localData.length} records to production`);
  }
}

async function main() {
  console.log('==========================================');
  console.log('🔄 Supabase Local → Production Sync');
  console.log('==========================================');
  console.log('');
  console.log('Local:  http://127.0.0.1:54321');
  console.log('Prod:   https://nfkshvmqqgosvcwztqyq.supabase.co');
  console.log('');
  
  const tables = [
    'menu_configs',
    'store_configs', 
    'tv_devices',
    'tv_commands',
    'tv_command_log'
  ];
  
  for (const table of tables) {
    await syncTable(table);
  }
  
  console.log('\n==========================================');
  console.log('✅ Sync Complete!');
  console.log('==========================================\n');
}

main().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});

