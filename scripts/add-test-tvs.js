/**
 * Add Test TV Devices to Database
 * Run with: node scripts/add-test-tvs.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jnodvbxwuczfwjfyzhvc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impub2R2Ynh3dWN6ZndqZnl6aHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4ODY3OTMsImV4cCI6MjA0MjQ2Mjc5M30.tZ4Feu-0gB7a-HqXX3rIZHCNMl1Asl0-CxYgwLvYGz0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestTVs() {
  const locationId = 20; // Charlotte Central location
  
  console.log(`\n🖥️  Adding test TV devices for location ${locationId}...\n`);
  
  // First, check existing TVs
  const { data: existing } = await supabase
    .from('tv_devices')
    .select('*')
    .eq('location_id', locationId);
  
  console.log(`📺 Found ${existing?.length || 0} existing TVs for location ${locationId}`);
  
  // Create 3 test TVs
  const testTVs = [
    {
      device_name: 'Front Counter Display',
      tv_number: 1,
      location_id: locationId,
      last_seen: new Date().toISOString(),
      metadata: {
        screen_width: 1920,
        screen_height: 1080,
        current_url: `http://localhost:3000/menu-display?location_id=${locationId}&tv_number=1`
      }
    },
    {
      device_name: 'Waiting Area TV',
      tv_number: 2,
      location_id: locationId,
      last_seen: new Date().toISOString(),
      metadata: {
        screen_width: 1920,
        screen_height: 1080,
        current_url: `http://localhost:3000/menu-display?location_id=${locationId}&tv_number=2`
      }
    },
    {
      device_name: 'Back Office Monitor',
      tv_number: 3,
      location_id: locationId,
      last_seen: new Date().toISOString(),
      metadata: {
        screen_width: 1920,
        screen_height: 1080,
        current_url: `http://localhost:3000/menu-display?location_id=${locationId}&tv_number=3`
      }
    }
  ];
  
  // Insert TVs
  const { data, error } = await supabase
    .from('tv_devices')
    .insert(testTVs)
    .select();
  
  if (error) {
    console.error('❌ Error adding TVs:', error.message);
    return;
  }
  
  console.log(`✅ Successfully added ${data.length} test TVs:\n`);
  data.forEach(tv => {
    console.log(`   📺 TV ${tv.tv_number}: ${tv.device_name} (ID: ${tv.id})`);
  });
  
  // Verify
  const { data: allTVs } = await supabase
    .from('tv_devices')
    .select('*')
    .eq('location_id', locationId)
    .order('tv_number');
  
  console.log(`\n📊 Total TVs for location ${locationId}: ${allTVs?.length || 0}\n`);
}

addTestTVs().catch(console.error);


