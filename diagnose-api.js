/**
 * API DIAGNOSTIC SCRIPT
 * Checks the actual response structure from Flora IM APIs
 */

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function floraImRequest(endpoint) {
  const url = new URL(`${API_BASE}/wp-json/flora-im/v1${endpoint}`);
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  return await response.json();
}

async function diagnose() {
  console.log('🔍 DIAGNOSING FLORA IM API RESPONSES\n');
  
  // Check locations
  console.log('1. LOCATIONS API:');
  console.log('━'.repeat(80));
  const locations = await floraImRequest('/locations');
  console.log('Response structure:', JSON.stringify(locations[0], null, 2));
  console.log(`Total locations: ${locations.length}\n`);
  
  // Check products for first location
  const locationId = locations[0].id;
  console.log(`2. PRODUCTS API (Location ${locationId}):`);
  console.log('━'.repeat(80));
  const productsResponse = await floraImRequest(`/products?location_id=${locationId}&per_page=5`);
  console.log('Response structure:');
  console.log(JSON.stringify(productsResponse, null, 2));
  
  if (productsResponse.data && productsResponse.data[0]) {
    console.log('\nFirst product structure:');
    console.log(JSON.stringify(productsResponse.data[0], null, 2));
  }
  
  // Check inventory
  if (productsResponse.data && productsResponse.data[0]) {
    const product = productsResponse.data[0];
    console.log(`\n3. INVENTORY API (Product ${product.id}, Location ${locationId}):`);
    console.log('━'.repeat(80));
    const inventory = await floraImRequest(`/inventory?product_id=${product.id}&location_id=${locationId}&variation_id=0`);
    console.log('Response:');
    console.log(JSON.stringify(inventory, null, 2));
  }
}

diagnose().catch(console.error);

