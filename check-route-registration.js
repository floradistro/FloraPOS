/**
 * Check if our new routes are actually being registered
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function checkRouteRegistration() {
    console.log('🔍 Checking Route Registration');
    console.log('=' .repeat(40));
    
    try {
        // Get the API index to see all registered routes
        const url = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`❌ Failed to get API index: ${response.status} ${response.statusText}`);
            return;
        }
        
        const apiIndex = await response.json();
        console.log('✅ Got API index');
        
        // Check for our new routes
        const routes = apiIndex.routes || {};
        
        console.log('\n📋 Checking for bulk endpoints:');
        
        const bulkEndpoints = [
            '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
            '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk', 
            '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
            '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
            '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update'
        ];
        
        let foundAny = false;
        
        for (const endpoint of bulkEndpoints) {
            if (routes[endpoint]) {
                console.log(`✅ Found: ${endpoint}`);
                console.log(`   Methods: ${routes[endpoint].methods.join(', ')}`);
                foundAny = true;
            } else {
                console.log(`❌ Missing: ${endpoint}`);
            }
        }
        
        if (!foundAny) {
            console.log('\n❌ NONE of our bulk endpoints are registered!');
            console.log('\nThis means either:');
            console.log('1. The plugin file wasn\'t uploaded correctly');
            console.log('2. There\'s a PHP syntax error preventing registration');
            console.log('3. The register_routes method isn\'t being called');
            
            // Show what routes ARE registered
            console.log('\n📋 Currently registered routes:');
            Object.keys(routes).forEach(route => {
                if (route.includes('addify_headless_inventory')) {
                    console.log(`   ${route} [${routes[route].methods.join(', ')}]`);
                }
            });
        } else {
            console.log('\n✅ Some bulk endpoints are registered but not working');
            console.log('This suggests a callback or permission issue');
        }
        
    } catch (error) {
        console.log(`❌ Error checking routes: ${error.message}`);
    }
}

// Run the check
checkRouteRegistration().catch(console.error);