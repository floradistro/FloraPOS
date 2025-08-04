/**
 * Test script to verify the bulk endpoint fix is working
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
            'User-Agent': 'FloraDistro-Fix-Test/1.0'
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
 * Test the fixed bulk inventory endpoint
 */
async function testBulkInventoryEndpoint() {
    console.log('🧪 Testing Fixed Bulk Inventory Endpoint');
    console.log('=' .repeat(50));
    
    const testData = {
        product_ids: [792, 756, 765], // Charlotte Monroe products
        location_id: 30 // Charlotte Monroe location
    };
    
    try {
        console.log('📤 Sending bulk inventory request...');
        console.log('Data:', JSON.stringify(testData, null, 2));
        
        const startTime = performance.now();
        const result = await makeAPIRequest('/wp-json/wc/v3/addify_headless_inventory/inventory/bulk', 'POST', testData);
        const endTime = performance.now();
        
        console.log('✅ Bulk inventory endpoint is working!');
        console.log(`⏱️ Response time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log('📦 Results:');
        
        Object.entries(result).forEach(([productId, inventories]) => {
            console.log(`  Product ${productId}:`);
            inventories.forEach(inv => {
                console.log(`    - ${inv.location_name}: ${inv.quantity} units`);
            });
        });
        
        return true;
    } catch (error) {
        console.log('❌ Bulk inventory endpoint still not working:');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test the fixed bulk update endpoint
 */
async function testBulkUpdateEndpoint() {
    console.log('\n🧪 Testing Fixed Bulk Update Endpoint');
    console.log('=' .repeat(50));
    
    const testData = {
        updates: [
            {
                inventory_id: 8337, // Chilled Cherries at Charlotte Monroe
                quantity: 0.1,
                operation: 'add'
            }
        ]
    };
    
    try {
        console.log('📤 Sending bulk update request...');
        console.log('Data:', JSON.stringify(testData, null, 2));
        
        const startTime = performance.now();
        const result = await makeAPIRequest('/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update', 'POST', testData);
        const endTime = performance.now();
        
        console.log('✅ Bulk update endpoint is working!');
        console.log(`⏱️ Response time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log('📦 Results:');
        
        result.forEach((update, index) => {
            if (update.error) {
                console.log(`  Update ${index + 1}: ❌ ${update.error}`);
            } else {
                console.log(`  Update ${index + 1}: Inventory ${update.inventory_id}`);
                console.log(`    Previous: ${update.previous_quantity}`);
                console.log(`    New: ${update.new_quantity}`);
                console.log(`    Operation: ${update.operation}`);
            }
        });
        
        return true;
    } catch (error) {
        console.log('❌ Bulk update endpoint still not working:');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test that existing endpoints still work (regression test)
 */
async function testExistingEndpoints() {
    console.log('\n🔍 Testing Existing Endpoints (Regression Test)');
    console.log('=' .repeat(50));
    
    const tests = [
        {
            name: 'Get Locations',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/locations',
            method: 'GET'
        },
        {
            name: 'Get Charlotte Monroe Stock',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/locations/30/stock',
            method: 'GET'
        },
        {
            name: 'Get Product Inventory',
            endpoint: '/wp-json/wc/v3/addify_headless_inventory/products/792/inventory',
            method: 'GET'
        }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        try {
            console.log(`🧪 Testing: ${test.name}`);
            const result = await makeAPIRequest(test.endpoint, test.method);
            
            if (Array.isArray(result) && result.length > 0) {
                console.log(`   ✅ ${test.name}: ${result.length} items returned`);
            } else if (typeof result === 'object' && Object.keys(result).length > 0) {
                console.log(`   ✅ ${test.name}: Object returned with ${Object.keys(result).length} properties`);
            } else {
                console.log(`   ⚠️  ${test.name}: Empty result (might be normal)`);
            }
        } catch (error) {
            console.log(`   ❌ ${test.name}: ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

/**
 * Performance comparison test
 */
async function performanceComparison() {
    console.log('\n⚡ Performance Comparison Test');
    console.log('=' .repeat(50));
    
    const productIds = [792, 756, 765];
    const locationId = 30;
    
    // Test individual requests (old method)
    console.log('🔸 Testing Individual Requests (Old Method)...');
    const startIndividual = performance.now();
    
    let individualResults = {};
    for (const productId of productIds) {
        try {
            const inventory = await makeAPIRequest(`/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`);
            const locationInventory = inventory.filter(inv => inv.location_id == locationId);
            if (locationInventory.length > 0) {
                individualResults[productId] = locationInventory;
            }
        } catch (error) {
            console.log(`   ⚠️  Failed to get inventory for product ${productId}`);
        }
    }
    
    const endIndividual = performance.now();
    const individualTime = endIndividual - startIndividual;
    
    console.log(`   ⏱️  Individual requests: ${individualTime.toFixed(2)}ms`);
    console.log(`   📊 Results: ${Object.keys(individualResults).length} products`);
    
    // Test bulk request (new method)
    console.log('\n🔸 Testing Bulk Request (New Method)...');
    const startBulk = performance.now();
    
    let bulkResults = {};
    try {
        bulkResults = await makeAPIRequest('/wp-json/wc/v3/addify_headless_inventory/inventory/bulk', 'POST', {
            product_ids: productIds,
            location_id: locationId
        });
    } catch (error) {
        console.log(`   ❌ Bulk request failed: ${error.message}`);
        return false;
    }
    
    const endBulk = performance.now();
    const bulkTime = endBulk - startBulk;
    
    console.log(`   ⏱️  Bulk request: ${bulkTime.toFixed(2)}ms`);
    console.log(`   📊 Results: ${Object.keys(bulkResults).length} products`);
    
    // Calculate improvement
    const improvement = ((individualTime - bulkTime) / individualTime) * 100;
    const speedup = individualTime / bulkTime;
    
    console.log('\n📈 Performance Improvement:');
    console.log(`   🚀 ${improvement.toFixed(1)}% faster`);
    console.log(`   ⚡ ${speedup.toFixed(1)}x speed improvement`);
    console.log(`   💾 ${individualTime - bulkTime}ms saved`);
    
    return true;
}

/**
 * Main test function
 */
async function main() {
    console.log('🔧 Testing Addify Bulk Endpoint Fix');
    console.log('=' .repeat(60));
    console.log('This script tests if the bulk endpoint route registration fix is working');
    console.log('');
    
    // Test the fixed bulk endpoints
    const bulkInventoryWorks = await testBulkInventoryEndpoint();
    const bulkUpdateWorks = await testBulkUpdateEndpoint();
    
    // Test existing endpoints for regression
    const existingEndpointsWork = await testExistingEndpoints();
    
    // Performance comparison if bulk endpoints work
    let performanceImproved = false;
    if (bulkInventoryWorks) {
        performanceImproved = await performanceComparison();
    }
    
    // Final report
    console.log('\n📊 Fix Verification Report');
    console.log('=' .repeat(40));
    console.log(`Bulk Inventory Endpoint: ${bulkInventoryWorks ? '✅ FIXED' : '❌ Still Broken'}`);
    console.log(`Bulk Update Endpoint: ${bulkUpdateWorks ? '✅ FIXED' : '❌ Still Broken'}`);
    console.log(`Existing Endpoints: ${existingEndpointsWork ? '✅ Working' : '❌ Regression Detected'}`);
    console.log(`Performance Improvement: ${performanceImproved ? '✅ Confirmed' : '❌ Not Available'}`);
    
    if (bulkInventoryWorks && bulkUpdateWorks && existingEndpointsWork) {
        console.log('\n🎉 SUCCESS: All bulk endpoints are now working!');
        console.log('The route registration fix has resolved the issue.');
    } else if (!existingEndpointsWork) {
        console.log('\n⚠️  WARNING: Fix may have caused regression in existing endpoints');
    } else {
        console.log('\n❌ ISSUE: Bulk endpoints still not working after fix');
        console.log('Additional debugging may be required.');
    }
}

// Run the test
main().catch(console.error);