/**
 * Test the bulk-inventory endpoint that we confirmed is registered
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testRegisteredBulkEndpoint() {
    console.log('🎯 Testing Confirmed Registered Bulk Endpoint');
    console.log('=' .repeat(50));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/bulk-inventory';
    console.log(`🔗 Endpoint: ${endpoint}`);
    console.log('✅ This endpoint is confirmed to be registered in the API index');
    
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    console.log(`📦 Request data:`, JSON.stringify(testData, null, 2));
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-RegisteredBulk/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`\n📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! The bulk endpoint is working!');
            
            if (typeof result === 'object' && result !== null) {
                const productCount = Object.keys(result).length;
                console.log(`📦 Products with inventory: ${productCount}`);
                
                Object.entries(result).forEach(([productId, inventory]) => {
                    console.log(`\n📋 Product ${productId}:`);
                    if (Array.isArray(inventory)) {
                        inventory.forEach(item => {
                            console.log(`   • ${item.quantity} units at ${item.location_name || `Location ${item.location_id}`}`);
                        });
                    }
                });
            } else {
                console.log('📋 Result:', JSON.stringify(result, null, 2));
            }
            
            return true;
            
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log('\n🐛 Parsed error:');
                console.log(`   Code: ${errorJson.code}`);
                console.log(`   Message: ${errorJson.message}`);
                
                if (errorJson.data) {
                    console.log(`   Data:`, JSON.stringify(errorJson.data, null, 2));
                }
                
                // Specific error handling
                if (errorJson.code === 'rest_no_route') {
                    console.log('\n💡 Analysis: Route not found despite being in API index');
                    console.log('   This suggests a callback method resolution issue');
                } else if (errorJson.code === 'rest_missing_callback_param') {
                    console.log('\n💡 Analysis: Required parameter missing');
                    console.log('   The endpoint is reachable but parameter validation failed');
                } else if (errorJson.code === 'rest_forbidden') {
                    console.log('\n💡 Analysis: Permission denied');
                    console.log('   The endpoint works but authentication failed');
                }
                
            } catch (e) {
                console.log('📄 Raw error text:', errorText);
            }
            
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return false;
    }
}

async function testWithMinimalData() {
    console.log('\n🧪 Testing with Minimal Data');
    console.log('=' .repeat(35));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/bulk-inventory';
    const minimalData = {
        product_ids: [792]
    };
    
    console.log(`📦 Minimal request:`, JSON.stringify(minimalData, null, 2));
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-Minimal/1.0'
            },
            body: JSON.stringify(minimalData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success with minimal data!');
            console.log('📋 Result:', JSON.stringify(result, null, 2));
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Still failed with minimal data');
            console.log('📄 Error:', errorText.substring(0, 200));
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing Registered Bulk Endpoints');
    console.log('The bulk-inventory endpoint is confirmed in the API index!');
    console.log('=' .repeat(65));
    
    const fullTest = await testRegisteredBulkEndpoint();
    
    if (!fullTest) {
        const minimalTest = await testWithMinimalData();
        
        if (minimalTest) {
            console.log('\n💡 Success with minimal data suggests parameter validation issue');
        }
    }
    
    console.log('\n📊 Final Analysis');
    console.log('=' .repeat(25));
    
    if (fullTest) {
        console.log('🎉 BULK ENDPOINTS ARE WORKING!');
        console.log('✅ The fix was successful!');
    } else {
        console.log('❌ Still troubleshooting bulk endpoints');
        console.log('💡 The route is registered but callback has issues');
        console.log('   Next: Check WordPress error logs for PHP errors');
    }
}

// Run the test
main().catch(console.error);