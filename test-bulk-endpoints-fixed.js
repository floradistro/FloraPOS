/**
 * Test the fixed bulk endpoints
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const CHARLOTTE_LOCATION_ID = 30;

async function testBulkInventoryEndpoints() {
    console.log('🔧 Testing Fixed Bulk Inventory Endpoints');
    console.log('=' .repeat(50));
    
    const endpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/simple-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
        '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory'
    ];
    
    const testData = {
        product_ids: [792, 756, 765],
        location_id: CHARLOTTE_LOCATION_ID
    };
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing: ${endpoint}`);
        
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FloraDistro-BulkFix/1.0'
                },
                body: JSON.stringify(testData)
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ SUCCESS!`);
                
                if (result.debug) {
                    console.log(`   🐛 Debug: ${result.debug}`);
                    console.log(`   📅 Timestamp: ${result.timestamp}`);
                } else if (typeof result === 'object' && result !== null) {
                    const productCount = Object.keys(result).length;
                    console.log(`   📦 Products with inventory: ${productCount}`);
                    
                    // Show first product's inventory
                    const firstProduct = Object.keys(result)[0];
                    if (firstProduct && result[firstProduct] && result[firstProduct][0]) {
                        const sample = result[firstProduct][0];
                        console.log(`   📋 Sample: Product ${firstProduct} - ${sample.quantity} units`);
                    }
                }
                
                return { success: true, endpoint, result };
                
            } else if (response.status === 400) {
                const errorText = await response.text();
                console.log(`   ⚠️  Validation error: ${errorText.substring(0, 100)}...`);
                
                // This means the endpoint is reachable but has validation issues
                return { success: 'validation_error', endpoint, error: errorText };
                
            } else if (response.status === 404) {
                console.log(`   ❌ Still 404 - endpoint not found`);
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

async function testBulkUpdateEndpoints() {
    console.log('\n🔧 Testing Fixed Bulk Update Endpoints');
    console.log('=' .repeat(45));
    
    // First get an inventory ID to update
    try {
        const inventoryUrl = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/products/792/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const inventoryResponse = await fetch(inventoryUrl);
        
        if (!inventoryResponse.ok) {
            console.log('❌ Could not get inventory for testing bulk update');
            return { success: false };
        }
        
        const inventoryData = await inventoryResponse.json();
        if (inventoryData.length === 0) {
            console.log('❌ No inventory found for testing bulk update');
            return { success: false };
        }
        
        const inventoryId = inventoryData[0].inventory_id;
        console.log(`✅ Using inventory ID ${inventoryId} for testing`);
        
        const endpoints = [
            '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
            '/wp-json/wc/v3/addify_headless_inventory/stock-bulk-update'
        ];
        
        const updateData = {
            updates: [
                {
                    inventory_id: inventoryId,
                    quantity: 100.5,
                    operation: 'set'
                }
            ]
        };
        
        for (const endpoint of endpoints) {
            console.log(`\n🔍 Testing: ${endpoint}`);
            
            try {
                const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'FloraDistro-BulkFix/1.0'
                    },
                    body: JSON.stringify(updateData)
                });
                
                console.log(`   Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`   ✅ SUCCESS! Updated ${result.length} inventory items`);
                    
                    if (result[0]) {
                        console.log(`   📋 Updated inventory ${result[0].inventory_id}: ${result[0].previous_quantity} → ${result[0].new_quantity}`);
                    }
                    
                    return { success: true, endpoint, result };
                    
                } else if (response.status === 400) {
                    const errorText = await response.text();
                    console.log(`   ⚠️  Validation error: ${errorText.substring(0, 100)}...`);
                    return { success: 'validation_error', endpoint, error: errorText };
                    
                } else if (response.status === 404) {
                    console.log(`   ❌ Still 404 - endpoint not found`);
                } else {
                    const errorText = await response.text();
                    console.log(`   ❌ Other error: ${errorText.substring(0, 100)}...`);
                }
                
            } catch (error) {
                console.log(`   ❌ Network error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error setting up bulk update test: ${error.message}`);
    }
    
    return { success: false };
}

async function main() {
    console.log('🎯 Testing Fixed Bulk Endpoints');
    console.log('Upload the updated plugin before running this test!');
    console.log('=' .repeat(60));
    
    // Test bulk inventory endpoints
    const inventoryResult = await testBulkInventoryEndpoints();
    
    // Test bulk update endpoints
    const updateResult = await testBulkUpdateEndpoints();
    
    console.log('\n📊 Final Results');
    console.log('=' .repeat(30));
    
    if (inventoryResult.success === true) {
        console.log('🎉 BULK INVENTORY ENDPOINTS ARE WORKING!');
        console.log(`   Working endpoint: ${inventoryResult.endpoint}`);
    } else if (inventoryResult.success === 'validation_error') {
        console.log('⚠️  Bulk inventory endpoints are reachable but have validation issues');
        console.log(`   Endpoint: ${inventoryResult.endpoint}`);
    } else {
        console.log('❌ Bulk inventory endpoints still not working');
    }
    
    if (updateResult.success === true) {
        console.log('🎉 BULK UPDATE ENDPOINTS ARE WORKING!');
        console.log(`   Working endpoint: ${updateResult.endpoint}`);
    } else if (updateResult.success === 'validation_error') {
        console.log('⚠️  Bulk update endpoints are reachable but have validation issues');
        console.log(`   Endpoint: ${updateResult.endpoint}`);
    } else {
        console.log('❌ Bulk update endpoints still not working');
    }
    
    if (inventoryResult.success === true && updateResult.success === true) {
        console.log('\n🎉 SUCCESS! All bulk endpoints are now functional!');
        console.log('🚀 You can now use efficient bulk operations in your POS system');
    } else if (inventoryResult.success !== false || updateResult.success !== false) {
        console.log('\n⚠️  Partial success - some endpoints are working or reachable');
        console.log('💡 Check the validation errors and adjust the request format');
    } else {
        console.log('\n❌ Still having issues with bulk endpoints');
        console.log('💡 May need to check WordPress error logs or plugin activation');
    }
}

// Run the test
main().catch(console.error);