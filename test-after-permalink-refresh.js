/**
 * Test bulk endpoints after permalink refresh
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const authenticatedEndpoint = `${endpoint}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FloraDistro-Post-Permalink-Test/1.0'
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
        throw error;
    }
}

async function testAllBulkEndpoints() {
    console.log('🚀 Testing Bulk Endpoints After Permalink Refresh');
    console.log('=' .repeat(60));
    
    const endpoints = [
        {
            name: 'get-bulk-inventory',
            url: '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
            data: { product_ids: [792, 756, 765], location_id: 30 }
        },
        {
            name: 'inventory-bulk',
            url: '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
            data: { product_ids: [792, 756, 765], location_id: 30 }
        },
        {
            name: 'original inventory/bulk',
            url: '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
            data: { product_ids: [792, 756, 765], location_id: 30 }
        },
        {
            name: 'stock-bulk-update',
            url: '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update',
            data: { updates: [{ inventory_id: 8337, quantity: 0.001, operation: 'add' }] }
        }
    ];
    
    const workingEndpoints = [];
    
    for (const endpoint of endpoints) {
        console.log(`\n🧪 Testing: ${endpoint.name}`);
        console.log(`📍 ${endpoint.url}`);
        
        try {
            const startTime = performance.now();
            const result = await makeAPIRequest(endpoint.url, 'POST', endpoint.data);
            const endTime = performance.now();
            
            console.log(`✅ SUCCESS! Response time: ${(endTime - startTime).toFixed(2)}ms`);
            
            if (endpoint.name.includes('inventory')) {
                const productCount = Object.keys(result).length;
                console.log(`📦 Products returned: ${productCount}`);
                
                // Show sample result
                const firstProduct = Object.keys(result)[0];
                if (firstProduct && result[firstProduct][0]) {
                    const sample = result[firstProduct][0];
                    console.log(`📋 Sample: Product ${firstProduct} - ${sample.quantity} units at ${sample.location_name}`);
                }
            } else if (endpoint.name.includes('update')) {
                console.log(`📦 Updates processed: ${Array.isArray(result) ? result.length : 'Object'}`);
                if (Array.isArray(result) && result[0]) {
                    const sample = result[0];
                    console.log(`📋 Sample: Inventory ${sample.inventory_id} - ${sample.previous_quantity} → ${sample.new_quantity}`);
                }
            }
            
            workingEndpoints.push({
                name: endpoint.name,
                url: endpoint.url,
                responseTime: endTime - startTime,
                result: result
            });
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);
        }
    }
    
    return workingEndpoints;
}

async function performanceTest(workingEndpoint) {
    if (!workingEndpoint || !workingEndpoint.name.includes('inventory')) {
        return null;
    }
    
    console.log('\n⚡ Performance Comparison Test');
    console.log('=' .repeat(40));
    
    const productIds = [792, 756, 765];
    const locationId = 30;
    
    // Individual requests
    console.log('🔸 Testing individual requests...');
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
            // Skip failed requests
        }
    }
    
    const endIndividual = performance.now();
    const individualTime = endIndividual - startIndividual;
    
    // Bulk request
    console.log('🔸 Testing bulk request...');
    const bulkTime = workingEndpoint.responseTime;
    
    const improvement = ((individualTime - bulkTime) / individualTime) * 100;
    const speedup = individualTime / bulkTime;
    
    console.log('\n📈 Performance Results:');
    console.log(`Individual: ${individualTime.toFixed(2)}ms (${productIds.length} requests)`);
    console.log(`Bulk: ${bulkTime.toFixed(2)}ms (1 request)`);
    console.log(`🚀 ${improvement.toFixed(1)}% faster`);
    console.log(`⚡ ${speedup.toFixed(1)}x speed improvement`);
    console.log(`💾 ${(individualTime - bulkTime).toFixed(2)}ms saved`);
    
    return { improvement, speedup, timeSaved: individualTime - bulkTime };
}

async function main() {
    const workingEndpoints = await testAllBulkEndpoints();
    
    console.log('\n📊 Final Results');
    console.log('=' .repeat(30));
    
    if (workingEndpoints.length > 0) {
        console.log('🎉 SUCCESS! Bulk endpoints are now working!');
        console.log('\n✅ Working endpoints:');
        
        workingEndpoints.forEach(endpoint => {
            console.log(`  - ${endpoint.name}: ${endpoint.responseTime.toFixed(2)}ms`);
        });
        
        // Performance test with first working inventory endpoint
        const inventoryEndpoint = workingEndpoints.find(e => e.name.includes('inventory'));
        if (inventoryEndpoint) {
            await performanceTest(inventoryEndpoint);
        }
        
        console.log('\n💡 Recommended endpoint for production:');
        const bestEndpoint = workingEndpoints[0];
        console.log(`POST ${bestEndpoint.url}`);
        
        if (bestEndpoint.name.includes('inventory')) {
            console.log(`Body: {"product_ids": [792, 756, 765], "location_id": 30}`);
        } else {
            console.log(`Body: {"updates": [{"inventory_id": 8337, "quantity": 1, "operation": "add"}]}`);
        }
        
    } else {
        console.log('❌ No bulk endpoints working yet.');
        console.log('Try the additional troubleshooting steps:');
        console.log('1. Deactivate and reactivate the plugin');
        console.log('2. Clear all caches (WordPress, server, CDN)');
        console.log('3. Check WordPress error logs');
    }
}

main().catch(console.error);