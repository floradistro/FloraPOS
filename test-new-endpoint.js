/**
 * Test the specific new bulk endpoint we created
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
            'User-Agent': 'FloraDistro-New-Endpoint-Test/1.0'
        }
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${authenticatedEndpoint}`, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error.message);
        throw error;
    }
}

/**
 * Test the new get-bulk-inventory endpoint specifically
 */
async function testNewBulkEndpoint() {
    console.log('🧪 Testing New get-bulk-inventory Endpoint');
    console.log('=' .repeat(50));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`📤 Data: ${JSON.stringify(testData, null, 2)}`);
    
    try {
        console.log('🔄 Sending request...');
        const startTime = performance.now();
        const result = await makeAPIRequest(endpoint, 'POST', testData);
        const endTime = performance.now();
        
        console.log('🎉 SUCCESS! New bulk endpoint is working!');
        console.log(`⏱️ Response time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log('📦 Results:');
        
        Object.entries(result).forEach(([productId, inventories]) => {
            console.log(`  Product ${productId}:`);
            inventories.forEach(inv => {
                console.log(`    - ${inv.location_name}: ${inv.quantity} units`);
            });
        });
        
        return { success: true, result, responseTime: endTime - startTime };
    } catch (error) {
        console.log('❌ New bulk endpoint failed:');
        console.log(`   Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Test all our new endpoints
 */
async function testAllNewEndpoints() {
    console.log('🔍 Testing All New Endpoints');
    console.log('=' .repeat(50));
    
    const endpoints = [
        {
            name: 'get-bulk-inventory',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
            data: { product_ids: [792, 756, 765], location_id: 30 }
        },
        {
            name: 'inventory-bulk',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
            data: { product_ids: [792, 756, 765], location_id: 30 }
        },
        {
            name: 'stock-bulk-update',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update',
            data: { updates: [{ inventory_id: 8337, quantity: 0.001, operation: 'add' }] }
        }
    ];
    
    const results = [];
    
    for (const test of endpoints) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log(`📍 ${test.endpoint}`);
        
        try {
            const startTime = performance.now();
            const result = await makeAPIRequest(test.endpoint, 'POST', test.data);
            const endTime = performance.now();
            
            console.log(`✅ ${test.name}: SUCCESS!`);
            console.log(`⏱️ Response time: ${(endTime - startTime).toFixed(2)}ms`);
            
            if (test.name.includes('inventory')) {
                console.log(`📊 Products returned: ${Object.keys(result).length}`);
            } else if (test.name.includes('update')) {
                console.log(`📊 Updates processed: ${Array.isArray(result) ? result.length : 'Object'}`);
            }
            
            results.push({ 
                name: test.name, 
                success: true, 
                responseTime: endTime - startTime,
                result: result 
            });
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED`);
            console.log(`   Error: ${error.message.substring(0, 100)}...`);
            results.push({ 
                name: test.name, 
                success: false, 
                error: error.message 
            });
        }
    }
    
    return results;
}

/**
 * Performance comparison if any endpoint works
 */
async function performanceComparison(workingEndpoint, workingData) {
    console.log('\n⚡ Performance Comparison');
    console.log('=' .repeat(40));
    
    const productIds = workingData.product_ids || [792, 756, 765];
    const locationId = workingData.location_id || 30;
    
    // Test individual requests
    console.log('🔸 Individual requests...');
    const startIndividual = performance.now();
    
    let individualCount = 0;
    for (const productId of productIds) {
        try {
            await makeAPIRequest(`/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`);
            individualCount++;
        } catch (error) {
            // Skip failed requests
        }
    }
    
    const endIndividual = performance.now();
    const individualTime = endIndividual - startIndividual;
    
    // Test bulk request
    console.log('🔸 Bulk request...');
    const startBulk = performance.now();
    
    try {
        const bulkResult = await makeAPIRequest(workingEndpoint, 'POST', workingData);
        const endBulk = performance.now();
        const bulkTime = endBulk - startBulk;
        
        const improvement = ((individualTime - bulkTime) / individualTime) * 100;
        const speedup = individualTime / bulkTime;
        
        console.log('\n📈 Performance Results:');
        console.log(`Individual: ${individualTime.toFixed(2)}ms (${individualCount} requests)`);
        console.log(`Bulk: ${bulkTime.toFixed(2)}ms (1 request)`);
        console.log(`Improvement: ${improvement.toFixed(1)}% faster`);
        console.log(`Speed up: ${speedup.toFixed(1)}x`);
        console.log(`Time saved: ${(individualTime - bulkTime).toFixed(2)}ms`);
        
        return { improvement, speedup, timeSaved: individualTime - bulkTime };
    } catch (error) {
        console.log('❌ Bulk request failed for performance test');
        return null;
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('🚀 Testing New Bulk Endpoints After Plugin Upload');
    console.log('=' .repeat(60));
    console.log('Testing the specific new endpoints we created in our fix');
    console.log('');
    
    // Test the main new endpoint first
    const mainResult = await testNewBulkEndpoint();
    
    // Test all new endpoints
    const allResults = await testAllNewEndpoints();
    
    // Find working endpoints
    const workingEndpoints = allResults.filter(r => r.success);
    
    // Performance comparison if any endpoint works
    let performanceResult = null;
    if (workingEndpoints.length > 0) {
        const workingEndpoint = workingEndpoints[0];
        const testData = workingEndpoint.name.includes('inventory') 
            ? { product_ids: [792, 756, 765], location_id: 30 }
            : { updates: [{ inventory_id: 8337, quantity: 0.001, operation: 'add' }] };
        
        // Only do performance test for inventory endpoints
        if (workingEndpoint.name.includes('inventory')) {
            performanceResult = await performanceComparison(
                `/wp-json/wc/v3/addify_headless_inventory/${workingEndpoint.name}`,
                testData
            );
        }
    }
    
    // Final report
    console.log('\n📊 Final Test Results');
    console.log('=' .repeat(40));
    
    if (workingEndpoints.length > 0) {
        console.log('🎉 SUCCESS! Fixed bulk endpoints are working!');
        console.log('\n✅ Working endpoints:');
        workingEndpoints.forEach(endpoint => {
            console.log(`  - ${endpoint.name}: ${endpoint.responseTime.toFixed(2)}ms`);
        });
        
        if (performanceResult) {
            console.log(`\n⚡ Performance improvement: ${performanceResult.improvement.toFixed(1)}% faster`);
            console.log(`🚀 Speed up: ${performanceResult.speedup.toFixed(1)}x`);
        }
        
        console.log('\n💡 Use these working endpoints:');
        workingEndpoints.forEach(endpoint => {
            if (endpoint.name.includes('inventory')) {
                console.log(`POST /wp-json/wc/v3/addify_headless_inventory/${endpoint.name}`);
                console.log(`Body: {"product_ids": [792, 756, 765], "location_id": 30}`);
            } else if (endpoint.name.includes('update')) {
                console.log(`POST /wp-json/wc/v3/addify_headless_inventory/${endpoint.name}`);
                console.log(`Body: {"updates": [{"inventory_id": 8337, "quantity": 1, "operation": "add"}]}`);
            }
        });
    } else {
        console.log('❌ No bulk endpoints are working yet.');
        console.log('The plugin may need additional debugging or server restart.');
    }
}

// Run the test
main().catch(console.error);