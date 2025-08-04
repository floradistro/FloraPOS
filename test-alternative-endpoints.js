/**
 * Test both original and alternative bulk endpoint routes
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Make authenticated API request
 */
async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const authenticatedEndpoint = `${endpoint}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FloraDistro-Alternative-Test/1.0'
        }
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${authenticatedEndpoint}`, config);
        
        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        return JSON.parse(responseText);
    } catch (error) {
        return { error: error.message, status: 'failed' };
    }
}

/**
 * Test multiple endpoint variations
 */
async function testBulkEndpointVariations() {
    console.log('🧪 Testing Bulk Endpoint Variations');
    console.log('=' .repeat(60));
    
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    const endpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/bulk-inventory',
        '/wp-json/wc/v3/addify_headless_inventory/bulkinventory'
    ];
    
    console.log('📤 Test data:', JSON.stringify(testData, null, 2));
    console.log('');
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Testing: ${endpoint}`);
        
        const startTime = performance.now();
        const result = await makeAPIRequest(endpoint, 'POST', testData);
        const endTime = performance.now();
        
        if (result.error) {
            console.log(`   ❌ Failed: ${result.error.substring(0, 100)}...`);
        } else {
            console.log(`   ✅ SUCCESS! Response time: ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`   📦 Results: ${Object.keys(result).length} products returned`);
            
            // Show sample result
            const firstProduct = Object.keys(result)[0];
            if (firstProduct && result[firstProduct][0]) {
                const sample = result[firstProduct][0];
                console.log(`   📋 Sample: Product ${firstProduct} - ${sample.quantity} units at ${sample.location_name}`);
            }
            
            return { endpoint, result, success: true };
        }
    }
    
    return { success: false };
}

/**
 * Test bulk update endpoint variations
 */
async function testBulkUpdateVariations() {
    console.log('\n🧪 Testing Bulk Update Endpoint Variations');
    console.log('=' .repeat(60));
    
    const testData = {
        updates: [
            {
                inventory_id: 8337,
                quantity: 0.01,
                operation: 'add'
            }
        ]
    };
    
    const endpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
        '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update',
        '/wp-json/wc/v3/addify_headless_inventory/bulk-update',
        '/wp-json/wc/v3/addify_headless_inventory/bulkupdate'
    ];
    
    console.log('📤 Test data:', JSON.stringify(testData, null, 2));
    console.log('');
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Testing: ${endpoint}`);
        
        const startTime = performance.now();
        const result = await makeAPIRequest(endpoint, 'POST', testData);
        const endTime = performance.now();
        
        if (result.error) {
            console.log(`   ❌ Failed: ${result.error.substring(0, 100)}...`);
        } else {
            console.log(`   ✅ SUCCESS! Response time: ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`   📦 Results: ${Array.isArray(result) ? result.length : 'Object'} updates processed`);
            
            // Show sample result
            if (Array.isArray(result) && result[0]) {
                const sample = result[0];
                console.log(`   📋 Sample: Inventory ${sample.inventory_id} - ${sample.previous_quantity} → ${sample.new_quantity}`);
            }
            
            return { endpoint, result, success: true };
        }
    }
    
    return { success: false };
}

/**
 * Test if the plugin is properly loaded by checking a simple endpoint
 */
async function testPluginLoading() {
    console.log('🔌 Testing Plugin Loading Status');
    console.log('=' .repeat(40));
    
    try {
        const locations = await makeAPIRequest('/wp-json/wc/v3/addify_headless_inventory/locations');
        
        if (locations.error) {
            console.log('❌ Plugin not properly loaded or accessible');
            return false;
        }
        
        console.log(`✅ Plugin loaded: ${locations.length} locations found`);
        
        // Check if our changes are reflected in the API
        const apiIndex = await makeAPIRequest('/wp-json/wc/v3/');
        
        if (apiIndex.routes) {
            const bulkRoutes = Object.keys(apiIndex.routes).filter(route => 
                route.includes('addify') && (route.includes('bulk') || route.includes('inventory'))
            );
            
            console.log('📋 Available bulk/inventory routes:');
            bulkRoutes.forEach(route => {
                console.log(`   - ${route}`);
            });
            
            return bulkRoutes.length > 0;
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Plugin loading test failed: ${error.message}`);
        return false;
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('🔧 Testing Alternative Bulk Endpoint Routes');
    console.log('=' .repeat(70));
    console.log('Testing both original and alternative route patterns after fix');
    console.log('');
    
    // Check plugin loading first
    const pluginLoaded = await testPluginLoading();
    
    if (!pluginLoaded) {
        console.log('\n❌ Plugin loading issues detected. Cannot proceed with endpoint tests.');
        return;
    }
    
    // Test bulk inventory endpoints
    const inventoryResult = await testBulkEndpointVariations();
    
    // Test bulk update endpoints
    const updateResult = await testBulkUpdateVariations();
    
    // Final report
    console.log('\n📊 Alternative Endpoint Test Results');
    console.log('=' .repeat(50));
    
    if (inventoryResult.success) {
        console.log(`✅ Bulk Inventory: WORKING on ${inventoryResult.endpoint}`);
    } else {
        console.log('❌ Bulk Inventory: All variations failed');
    }
    
    if (updateResult.success) {
        console.log(`✅ Bulk Update: WORKING on ${updateResult.endpoint}`);
    } else {
        console.log('❌ Bulk Update: All variations failed');
    }
    
    if (inventoryResult.success || updateResult.success) {
        console.log('\n🎉 SUCCESS: At least one bulk endpoint is now working!');
        console.log('The route registration fix has partially resolved the issue.');
        
        if (inventoryResult.success) {
            console.log(`\n💡 Use this working endpoint for bulk inventory:`);
            console.log(`   POST ${inventoryResult.endpoint}`);
            console.log(`   Body: {"product_ids": [792, 756, 765], "location_id": 30}`);
        }
        
        if (updateResult.success) {
            console.log(`\n💡 Use this working endpoint for bulk updates:`);
            console.log(`   POST ${updateResult.endpoint}`);
            console.log(`   Body: {"updates": [{"inventory_id": 8337, "quantity": 1, "operation": "add"}]}`);
        }
    } else {
        console.log('\n❌ No bulk endpoints are working yet.');
        console.log('Additional debugging or server restart may be required.');
        console.log('The plugin changes may need time to take effect or cache clearing.');
    }
}

// Run the test
main().catch(console.error);