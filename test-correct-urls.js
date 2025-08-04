/**
 * Test bulk endpoints with the correct URL format (without /wp-json prefix)
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testCorrectURLs() {
    console.log('🎯 Testing Bulk Endpoints with Correct URLs');
    console.log('=' .repeat(50));
    
    // The routes are registered as /wc/v3/... not /wp-json/wc/v3/...
    // But we still need to access them via the wp-json endpoint
    const bulkEndpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory',
        '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
        '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update'
    ];
    
    const testData = {
        product_ids: [792, 756],
        location_id: 30
    };
    
    console.log('📋 Testing all bulk endpoints:');
    
    for (const endpoint of bulkEndpoints) {
        console.log(`\n🔍 Testing: ${endpoint}`);
        
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FloraDistro-Debug/1.0'
                },
                body: JSON.stringify(testData)
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ SUCCESS!`);
                
                if (typeof result === 'object' && result !== null) {
                    const productCount = Object.keys(result).length;
                    console.log(`   📦 Products returned: ${productCount}`);
                    
                    // Show first product's inventory as example
                    const firstProduct = Object.keys(result)[0];
                    if (firstProduct && result[firstProduct] && result[firstProduct][0]) {
                        const sample = result[firstProduct][0];
                        console.log(`   📋 Sample: Product ${firstProduct} - ${sample.quantity} units at ${sample.location_name || 'location ' + sample.location_id}`);
                    }
                } else {
                    console.log(`   📋 Result: ${JSON.stringify(result)}`);
                }
                
                return { success: true, endpoint, result };
                
            } else if (response.status === 400) {
                const errorText = await response.text();
                console.log(`   ⚠️  Validation error (endpoint reachable): ${errorText.substring(0, 150)}...`);
                
                // Try with minimal data to see if it's a validation issue
                console.log(`   🔧 Trying with minimal data...`);
                const minimalResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'FloraDistro-Debug/1.0'
                    },
                    body: JSON.stringify({ product_ids: [792] })
                });
                
                if (minimalResponse.ok) {
                    const minimalResult = await minimalResponse.json();
                    console.log(`   ✅ Works with minimal data! Products: ${Object.keys(minimalResult).length}`);
                    return { success: true, endpoint, result: minimalResult, note: 'Required minimal data' };
                } else {
                    console.log(`   ❌ Still fails with minimal data: ${minimalResponse.status}`);
                }
                
            } else if (response.status === 404) {
                console.log(`   ❌ Still 404 - route not found`);
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Other error: ${errorText.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ Network error: ${error.message}`);
        }
    }
    
    return { success: false };
}

async function testBulkUpdate() {
    console.log('\n🔧 Testing Bulk Update Endpoints');
    console.log('=' .repeat(40));
    
    const updateEndpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
        '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update'
    ];
    
    // First, let's get some inventory IDs to update
    try {
        const inventoryUrl = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/products/792/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const inventoryResponse = await fetch(inventoryUrl);
        
        if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            if (inventoryData.length > 0) {
                const inventoryId = inventoryData[0].inventory_id;
                console.log(`✅ Found inventory ID: ${inventoryId}`);
                
                const updateData = {
                    updates: [
                        {
                            inventory_id: inventoryId,
                            quantity: 1.0,
                            operation: 'set'
                        }
                    ]
                };
                
                for (const endpoint of updateEndpoints) {
                    console.log(`\n🔍 Testing: ${endpoint}`);
                    
                    try {
                        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'FloraDistro-Debug/1.0'
                            },
                            body: JSON.stringify(updateData)
                        });
                        
                        console.log(`   Status: ${response.status} ${response.statusText}`);
                        
                        if (response.ok) {
                            const result = await response.json();
                            console.log(`   ✅ SUCCESS! Updated ${result.length} inventory items`);
                            return true;
                        } else if (response.status === 400) {
                            const errorText = await response.text();
                            console.log(`   ⚠️  Validation error: ${errorText.substring(0, 100)}...`);
                        } else {
                            const errorText = await response.text();
                            console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
                        }
                    } catch (error) {
                        console.log(`   ❌ Network error: ${error.message}`);
                    }
                }
            }
        }
    } catch (error) {
        console.log(`❌ Could not get inventory IDs: ${error.message}`);
    }
    
    return false;
}

async function main() {
    // Test bulk inventory endpoints
    const inventoryResult = await testCorrectURLs();
    
    // Test bulk update endpoints
    const updateResult = await testBulkUpdate();
    
    console.log('\n📊 Final Results');
    console.log('=' .repeat(30));
    
    if (inventoryResult.success) {
        console.log('🎉 BULK INVENTORY ENDPOINTS ARE WORKING!');
        console.log(`   Working endpoint: ${inventoryResult.endpoint}`);
        if (inventoryResult.note) {
            console.log(`   Note: ${inventoryResult.note}`);
        }
    } else {
        console.log('❌ Bulk inventory endpoints still not working');
    }
    
    if (updateResult) {
        console.log('🎉 BULK UPDATE ENDPOINTS ARE WORKING!');
    } else {
        console.log('❌ Bulk update endpoints still not working');
    }
    
    if (inventoryResult.success || updateResult) {
        console.log('\n✅ SUCCESS! The bulk endpoints are now functional!');
        console.log('🚀 You can now use these for efficient bulk operations');
    } else {
        console.log('\n❌ Still having issues - may need further debugging');
    }
}

// Run the test
main().catch(console.error);