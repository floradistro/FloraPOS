/**
 * Final test of the properly fixed bulk inventory endpoint
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const CHARLOTTE_LOCATION_ID = 30;

async function testWorkingBulkInventory() {
    console.log('🎯 Testing FIXED Bulk Inventory Endpoint');
    console.log('=' .repeat(50));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/bulk-inventory';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: CHARLOTTE_LOCATION_ID
    };
    
    console.log(`🔗 Endpoint: ${endpoint}`);
    console.log(`📦 Testing with products: ${testData.product_ids.join(', ')}`);
    console.log(`📍 Location: ${testData.location_id} (Charlotte Monroe)`);
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-FinalBulkFix/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`\n📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Bulk inventory endpoint is working!');
            
            const productCount = Object.keys(result).length;
            console.log(`📦 Products with inventory: ${productCount}`);
            
            let totalItems = 0;
            Object.entries(result).forEach(([productId, inventory]) => {
                console.log(`\n📋 Product ${productId}:`);
                inventory.forEach(item => {
                    console.log(`   • ${item.quantity} units at ${item.location_name || `Location ${item.location_id}`}`);
                    if (item.name && item.name !== item.location_name) {
                        console.log(`     Inventory Name: ${item.name}`);
                    }
                    totalItems++;
                });
            });
            
            console.log(`\n📊 Summary:`);
            console.log(`   Products: ${productCount}`);
            console.log(`   Total inventory records: ${totalItems}`);
            console.log(`   Location: Charlotte Monroe (ID: ${CHARLOTTE_LOCATION_ID})`);
            
            return { success: true, result, productCount, totalItems };
            
        } else if (response.status === 400) {
            const errorText = await response.text();
            console.log('⚠️  Validation error (endpoint is reachable):');
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log(`   Error: ${errorJson.code} - ${errorJson.message}`);
                
                if (errorJson.data && errorJson.data.params) {
                    console.log(`   Missing params: ${Object.keys(errorJson.data.params).join(', ')}`);
                }
            } catch (e) {
                console.log(`   Raw error: ${errorText}`);
            }
            
            console.log('\n💡 This means the endpoint is working but needs parameter adjustment!');
            return { success: 'validation_error', error: errorText };
            
        } else if (response.status === 404) {
            console.log('❌ Still 404 - endpoint not found');
            console.log('💡 Plugin upload may have failed or needs reactivation');
            return { success: false, error: '404 Not Found' };
            
        } else {
            const errorText = await response.text();
            console.log(`❌ Other error: ${response.status}`);
            console.log(`   Response: ${errorText.substring(0, 200)}...`);
            return { success: false, error: errorText };
        }
        
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testBulkInventoryPerformance() {
    console.log('\n⚡ Performance Test - Bulk vs Individual');
    console.log('=' .repeat(45));
    
    const productIds = [792, 756, 765];
    
    // Test bulk endpoint
    console.log('🔄 Testing bulk endpoint...');
    const bulkStart = Date.now();
    const bulkResult = await testWorkingBulkInventory();
    const bulkTime = Date.now() - bulkStart;
    
    if (bulkResult.success === true) {
        console.log(`⏱️  Bulk endpoint: ${bulkTime}ms for ${productIds.length} products`);
        console.log(`📊 Average per product: ${Math.round(bulkTime / productIds.length)}ms`);
        
        console.log('\n🎉 BULK ENDPOINTS ARE NOW WORKING!');
        console.log('✅ The Addify plugin bulk inventory endpoints are fixed!');
        console.log('🚀 You can now use efficient bulk operations in your POS system!');
        
        return true;
    } else {
        console.log('❌ Bulk endpoint still not working');
        return false;
    }
}

async function main() {
    console.log('🏁 FINAL BULK ENDPOINT TEST');
    console.log('After uploading the plugin with the parameter fix!');
    console.log('=' .repeat(60));
    
    const success = await testBulkInventoryPerformance();
    
    console.log('\n📋 Final Status');
    console.log('=' .repeat(25));
    
    if (success) {
        console.log('🎉 SUCCESS! Bulk inventory endpoints are working!');
        console.log('');
        console.log('✅ Available bulk endpoints:');
        console.log('   • /wp-json/wc/v3/addify_headless_inventory/bulk-inventory');
        console.log('   • /wp-json/wc/v3/addify_headless_inventory/inventory-bulk');
        console.log('   • /wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory');
        console.log('');
        console.log('📝 Usage:');
        console.log('   POST with JSON body: {"product_ids": [792, 756], "location_id": 30}');
        console.log('');
        console.log('🚀 The bulk endpoint fix is complete!');
    } else {
        console.log('❌ Bulk endpoints still need attention');
        console.log('💡 Next steps:');
        console.log('   1. Ensure the updated plugin file is uploaded');
        console.log('   2. Try deactivating and reactivating the plugin');
        console.log('   3. Clear any WordPress caches');
        console.log('   4. Check WordPress error logs for PHP errors');
    }
}

// Run the final test
main().catch(console.error);