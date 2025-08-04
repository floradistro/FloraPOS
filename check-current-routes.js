/**
 * Check what Addify routes are currently registered
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function checkCurrentRoutes() {
    console.log('🔍 Checking Currently Registered Addify Routes');
    console.log('=' .repeat(50));
    
    try {
        // Get all WooCommerce routes
        const url = `${API_BASE}/wp-json/wc/v3?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`❌ Failed to get WC API index: ${response.status} ${response.statusText}`);
            return;
        }
        
        const wcIndex = await response.json();
        const routes = wcIndex.routes || {};
        
        console.log('✅ Got WooCommerce API index');
        console.log(`Total routes: ${Object.keys(routes).length}`);
        
        // Filter for Addify routes
        const addifyRoutes = Object.keys(routes).filter(route => 
            route.includes('addify_headless_inventory')
        );
        
        console.log(`\n📋 Found ${addifyRoutes.length} Addify routes:`);
        
        if (addifyRoutes.length === 0) {
            console.log('❌ NO Addify routes found at all!');
            console.log('This means the plugin is not loaded or has a fatal error');
            return;
        }
        
        // Show all Addify routes
        addifyRoutes.sort().forEach(route => {
            const routeInfo = routes[route];
            const methods = routeInfo.methods || [];
            console.log(`   ${route}`);
            console.log(`     Methods: ${methods.join(', ')}`);
            
            // Check if it's one of our new routes
            if (route.includes('test-endpoint') || 
                route.includes('inventory-bulk') || 
                route.includes('get-bulk-inventory') ||
                route.includes('bulk-update')) {
                console.log(`     🆕 This is a NEW route from our update!`);
            }
        });
        
        // Check specifically for our new routes
        console.log('\n🎯 Checking for our specific new routes:');
        const ourNewRoutes = [
            '/wp-json/wc/v3/addify_headless_inventory/test-endpoint',
            '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
            '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
            '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
            '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
            '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update'
        ];
        
        let foundNewRoutes = 0;
        ourNewRoutes.forEach(route => {
            if (routes[route]) {
                console.log(`   ✅ ${route} - FOUND`);
                foundNewRoutes++;
            } else {
                console.log(`   ❌ ${route} - MISSING`);
            }
        });
        
        if (foundNewRoutes === 0) {
            console.log('\n❌ NONE of our new routes are registered!');
            console.log('📝 This confirms the updated plugin file was NOT uploaded');
            console.log('   or there\'s a PHP fatal error preventing registration');
        } else if (foundNewRoutes < ourNewRoutes.length) {
            console.log(`\n⚠️  Only ${foundNewRoutes}/${ourNewRoutes.length} new routes found`);
            console.log('📝 Partial update - some routes registered but not all');
        } else {
            console.log('\n✅ ALL new routes are registered!');
            console.log('📝 The plugin update was successful');
            console.log('💡 The 404 issue must be something else');
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Run the check
checkCurrentRoutes().catch(console.error);