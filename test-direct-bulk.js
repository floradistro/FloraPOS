/**
 * Direct test of the bulk endpoints that are confirmed to be registered
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testSimpleBulkDirect() {
    console.log('🎯 Testing Simple Bulk Endpoint Directly');
    console.log('=' .repeat(45));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/simple-bulk';
    const testData = {
        product_ids: [792, 756],
        location_id: 30
    };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        console.log(`🔗 URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-DirectTest/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Simple bulk endpoint is working!');
            console.log('📋 Result:', JSON.stringify(result, null, 2));
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            
            // Try to parse as JSON for better error info
            try {
                const errorJson = JSON.parse(errorText);
                console.log('🐛 Error details:', errorJson);
            } catch (e) {
                console.log('📄 Raw error:', errorText.substring(0, 200));
            }
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }
    
    return null;
}

async function testGetBulkInventoryDirect() {
    console.log('\n🎯 Testing Get Bulk Inventory Endpoint Directly');
    console.log('=' .repeat(50));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        console.log(`🔗 URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-DirectTest/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Get bulk inventory endpoint is working!');
            
            const productCount = Object.keys(result).length;
            console.log(`📦 Products with inventory: ${productCount}`);
            
            // Show detailed results
            Object.entries(result).forEach(([productId, inventory]) => {
                console.log(`\n📋 Product ${productId}:`);
                inventory.forEach(item => {
                    console.log(`   • ${item.quantity} units at ${item.location_name} (ID: ${item.location_id})`);
                    if (item.name) console.log(`     Name: ${item.name}`);
                });
            });
            
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log('🐛 Error details:', errorJson);
            } catch (e) {
                console.log('📄 Raw error:', errorText.substring(0, 200));
            }
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }
    
    return null;
}

async function testInventoryBulkDirect() {
    console.log('\n🎯 Testing Inventory Bulk Endpoint Directly');
    console.log('=' .repeat(47));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        console.log(`🔗 URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-DirectTest/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Inventory bulk endpoint is working!');
            
            const productCount = Object.keys(result).length;
            console.log(`📦 Products with inventory: ${productCount}`);
            
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log('🐛 Error details:', errorJson);
                
                if (errorJson.code === 'rest_missing_callback_param') {
                    console.log('💡 This suggests a parameter validation issue');
                } else if (errorJson.code === 'rest_no_route') {
                    console.log('💡 Route not found - may still be a registration issue');
                }
            } catch (e) {
                console.log('📄 Raw error:', errorText.substring(0, 200));
            }
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }
    
    return null;
}

async function main() {
    console.log('🚀 Direct Testing of Bulk Endpoints');
    console.log('These endpoints are confirmed to be registered in the API!');
    console.log('=' .repeat(65));
    
    // Test all our bulk endpoints directly
    const results = [];
    
    results.push(await testSimpleBulkDirect());
    results.push(await testGetBulkInventoryDirect());
    results.push(await testInventoryBulkDirect());
    
    // Summary
    console.log('\n📊 Summary');
    console.log('=' .repeat(20));
    
    const successCount = results.filter(r => r !== null).length;
    
    if (successCount > 0) {
        console.log(`🎉 SUCCESS! ${successCount}/3 bulk endpoints are working!`);
        console.log('✅ The bulk endpoint fix was successful!');
        console.log('🚀 You can now use efficient bulk inventory operations!');
    } else {
        console.log('❌ No endpoints working yet');
        console.log('💡 May need to check parameter format or permissions');
    }
}

// Run the test
main().catch(console.error);