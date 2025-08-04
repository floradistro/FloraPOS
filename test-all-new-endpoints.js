/**
 * Test all the new endpoints we've created to isolate the issue
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testEndpoint(endpoint, data = {}, description = '') {
    console.log(`\n🔍 Testing: ${endpoint}`);
    if (description) console.log(`   Description: ${description}`);
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-AllEndpoints/1.0'
            },
            body: JSON.stringify(data)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ SUCCESS!`);
            
            if (result.success) {
                console.log(`   📋 Message: ${result.message}`);
            } else if (typeof result === 'object') {
                const keys = Object.keys(result);
                console.log(`   📋 Response has ${keys.length} properties: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
            }
            
            return true;
        } else {
            const errorText = await response.text();
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log(`   ❌ Error: ${errorJson.code} - ${errorJson.message}`);
                
                if (errorJson.code === 'rest_no_route') {
                    console.log(`   💡 Route not found - registration issue`);
                } else if (errorJson.code === 'rest_missing_callback_param') {
                    console.log(`   💡 Missing required parameter`);
                } else if (errorJson.code === 'rest_forbidden') {
                    console.log(`   💡 Permission denied`);
                }
            } catch (e) {
                console.log(`   ❌ Raw error: ${errorText.substring(0, 100)}...`);
            }
            
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing All New Endpoints');
    console.log('Make sure the updated plugin is uploaded and activated!');
    console.log('=' .repeat(65));
    
    const results = [];
    
    // Test ultra simple endpoint
    results.push({
        name: 'Ultra Simple Test',
        success: await testEndpoint(
            '/wp-json/wc/v3/addify_headless_inventory/test-simple',
            { test: 'data' },
            'Basic endpoint with inline callback'
        )
    });
    
    // Test bulk test endpoint with exact same pattern as working endpoints
    results.push({
        name: 'Bulk Test (Same Pattern)',
        success: await testEndpoint(
            '/wp-json/wc/v3/addify_headless_inventory/bulk-test',
            { product_ids: [792], location_id: 30 },
            'Uses exact same registration pattern as working endpoints'
        )
    });
    
    // Test simple bulk with fixed callback
    results.push({
        name: 'Simple Bulk Fixed',
        success: await testEndpoint(
            '/wp-json/wc/v3/addify_headless_inventory/simple-bulk',
            { product_ids: [792, 756], location_id: 30 },
            'Simple bulk with inline callback'
        )
    });
    
    // Test the original bulk endpoints
    const bulkEndpoints = [
        { 
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
            name: 'Inventory Bulk'
        },
        { 
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
            name: 'Inventory Bulk (Original)'
        },
        { 
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
            name: 'Get Bulk Inventory'
        }
    ];
    
    for (const bulk of bulkEndpoints) {
        results.push({
            name: bulk.name,
            success: await testEndpoint(
                bulk.endpoint,
                { product_ids: [792], location_id: 30 },
                'Original bulk inventory endpoint'
            )
        });
    }
    
    // Summary
    console.log('\n📊 Summary Results');
    console.log('=' .repeat(30));
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    if (successful > 0) {
        console.log('\n🎉 Some endpoints are working!');
        console.log('Working endpoints:');
        results.filter(r => r.success).forEach(r => {
            console.log(`   ✅ ${r.name}`);
        });
        
        if (successful < total) {
            console.log('\nFailed endpoints:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`   ❌ ${r.name}`);
            });
        }
    } else {
        console.log('\n❌ No endpoints are working');
        console.log('💡 Possible issues:');
        console.log('   1. Plugin file not uploaded correctly');
        console.log('   2. WordPress caching the old routes');
        console.log('   3. Plugin needs to be deactivated/reactivated');
        console.log('   4. PHP fatal error preventing route registration');
    }
    
    // Check if routes are at least registered
    console.log('\n🔍 Quick route registration check...');
    try {
        const response = await fetch(`${API_BASE}/wp-json/wc/v3?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
        if (response.ok) {
            const apiIndex = await response.json();
            const routes = Object.keys(apiIndex.routes || {});
            const addifyRoutes = routes.filter(r => r.includes('addify_headless_inventory'));
            
            console.log(`📋 Found ${addifyRoutes.length} Addify routes in API index`);
            
            const newRoutes = addifyRoutes.filter(r => 
                r.includes('test-simple') || 
                r.includes('bulk-test') || 
                r.includes('simple-bulk') ||
                r.includes('inventory-bulk') ||
                r.includes('get-bulk-inventory')
            );
            
            if (newRoutes.length > 0) {
                console.log(`✅ ${newRoutes.length} new routes found in API index:`);
                newRoutes.forEach(route => console.log(`   • ${route}`));
                console.log('💡 Routes are registered but not callable - callback issue');
            } else {
                console.log('❌ No new routes found in API index - upload issue');
            }
        }
    } catch (error) {
        console.log(`❌ Could not check API index: ${error.message}`);
    }
}

// Run the test
main().catch(console.error);