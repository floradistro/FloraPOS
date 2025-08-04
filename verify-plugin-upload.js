/**
 * Verify if the correct version of the plugin has been uploaded
 * by checking for our new endpoints and debugging info
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Check if our new endpoints are registered in the API
 */
async function checkAPIRoutes() {
    console.log('🔍 Checking API Routes for Our New Endpoints');
    console.log('=' .repeat(50));
    
    try {
        const response = await fetch(`${API_BASE}/wp-json/wc/v3/?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
        
        if (!response.ok) {
            console.log('❌ Cannot access WooCommerce API');
            return false;
        }
        
        const data = await response.json();
        const routes = Object.keys(data.routes || {});
        
        // Check for our specific new endpoints
        const expectedRoutes = [
            '/wc/v3/addify_headless_inventory/get-bulk-inventory',
            '/wc/v3/addify_headless_inventory/inventory-bulk',
            '/wc/v3/addify_headless_inventory/stock-bulk-update'
        ];
        
        console.log('📋 Checking for our new endpoints:');
        let foundCount = 0;
        
        expectedRoutes.forEach(expectedRoute => {
            const found = routes.includes(expectedRoute);
            console.log(`  ${found ? '✅' : '❌'} ${expectedRoute}`);
            if (found) foundCount++;
        });
        
        console.log(`\n📊 Found ${foundCount}/${expectedRoutes.length} new endpoints`);
        
        if (foundCount === expectedRoutes.length) {
            console.log('✅ All new endpoints are registered - plugin uploaded correctly!');
            return true;
        } else if (foundCount > 0) {
            console.log('⚠️  Some endpoints found - plugin partially uploaded');
            return false;
        } else {
            console.log('❌ No new endpoints found - old plugin version still active');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error checking routes: ${error.message}`);
        return false;
    }
}

/**
 * Test if the plugin needs reactivation by checking a simple endpoint
 */
async function testPluginStatus() {
    console.log('\n🔌 Testing Plugin Status');
    console.log('=' .repeat(30));
    
    try {
        const response = await fetch(`${API_BASE}/wp-json/wc/v3/addify_headless_inventory/locations?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
        
        if (response.ok) {
            const locations = await response.json();
            console.log(`✅ Plugin is active: ${locations.length} locations found`);
            return true;
        } else {
            console.log('❌ Plugin not responding correctly');
            return false;
        }
    } catch (error) {
        console.log(`❌ Plugin test failed: ${error.message}`);
        return false;
    }
}

/**
 * Check WordPress permalink structure (affects REST API routes)
 */
async function checkWordPressSetup() {
    console.log('\n🔧 Checking WordPress REST API Setup');
    console.log('=' .repeat(40));
    
    try {
        // Test basic WordPress REST API
        const response = await fetch(`${API_BASE}/wp-json/`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ WordPress REST API active: ${data.name || 'Unknown site'}`);
            console.log(`📍 API URL: ${data.url || 'Unknown'}`);
            console.log(`🔗 REST URL: ${data.home || 'Unknown'}`);
            
            // Check if WooCommerce REST API is accessible
            const wcResponse = await fetch(`${API_BASE}/wp-json/wc/v3/?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
            
            if (wcResponse.ok) {
                console.log('✅ WooCommerce REST API accessible');
                return true;
            } else {
                console.log('❌ WooCommerce REST API not accessible');
                return false;
            }
        } else {
            console.log('❌ WordPress REST API not accessible');
            return false;
        }
    } catch (error) {
        console.log(`❌ WordPress setup check failed: ${error.message}`);
        return false;
    }
}

/**
 * Provide specific troubleshooting steps
 */
function provideTroubleshootingSteps(routesFound, pluginActive, wpSetupOk) {
    console.log('\n🛠️  Troubleshooting Recommendations');
    console.log('=' .repeat(50));
    
    if (!wpSetupOk) {
        console.log('❌ WordPress/WooCommerce REST API Issue:');
        console.log('   1. Check if WordPress permalinks are set to "Post name" or custom');
        console.log('   2. Verify WooCommerce is active and updated');
        console.log('   3. Check server .htaccess file for REST API blocks');
        return;
    }
    
    if (!pluginActive) {
        console.log('❌ Plugin Not Active:');
        console.log('   1. Go to WordPress Admin → Plugins');
        console.log('   2. Make sure "Addify Multi-Location Inventory" is activated');
        console.log('   3. Check for any plugin conflicts or errors');
        return;
    }
    
    if (!routesFound) {
        console.log('❌ Old Plugin Version Still Active:');
        console.log('   1. Verify the modified plugin files were uploaded correctly');
        console.log('   2. Check file permissions (should be 644 for PHP files)');
        console.log('   3. Try deactivating and reactivating the plugin:');
        console.log('      WordPress Admin → Plugins → Deactivate → Activate');
        console.log('   4. Clear any WordPress/server caches');
        console.log('   5. Go to Settings → Permalinks → Save Changes (refreshes routes)');
        return;
    }
    
    console.log('⚠️  Routes Found But Not Working:');
    console.log('   This is likely a WordPress caching/rewrite rule issue:');
    console.log('   1. Go to WordPress Admin → Settings → Permalinks');
    console.log('   2. Click "Save Changes" (this rebuilds rewrite rules)');
    console.log('   3. Clear any caching plugins (WP Rocket, W3 Total Cache, etc.)');
    console.log('   4. If using a CDN (Cloudflare), purge the cache');
    console.log('   5. Try deactivating/reactivating the plugin');
    console.log('   6. Check WordPress error logs for any PHP errors');
}

/**
 * Main verification function
 */
async function main() {
    console.log('🔍 Verifying Plugin Upload and Configuration');
    console.log('=' .repeat(60));
    console.log('Checking if the fixed Addify plugin is properly uploaded and active');
    console.log('');
    
    // Check WordPress and WooCommerce setup
    const wpSetupOk = await checkWordPressSetup();
    
    // Check if plugin is active
    const pluginActive = await testPluginStatus();
    
    // Check if our new routes are registered
    const routesFound = await checkAPIRoutes();
    
    // Provide troubleshooting steps
    provideTroubleshootingSteps(routesFound, pluginActive, wpSetupOk);
    
    // Final summary
    console.log('\n📊 Verification Summary');
    console.log('=' .repeat(30));
    console.log(`WordPress Setup: ${wpSetupOk ? '✅ OK' : '❌ Issue'}`);
    console.log(`Plugin Active: ${pluginActive ? '✅ Yes' : '❌ No'}`);
    console.log(`New Routes Found: ${routesFound ? '✅ Yes' : '❌ No'}`);
    
    if (wpSetupOk && pluginActive && routesFound) {
        console.log('\n🎯 NEXT STEP: Try the permalink refresh:');
        console.log('   WordPress Admin → Settings → Permalinks → Save Changes');
        console.log('   Then test the bulk endpoints again.');
    } else {
        console.log('\n⚠️  Issues detected - follow troubleshooting steps above');
    }
}

// Run verification
main().catch(console.error);