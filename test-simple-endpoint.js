/**
 * Test our simple test endpoint to see if POST routes work at all
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testSimpleEndpoint() {
    console.log('🧪 Testing Simple Test Endpoint');
    console.log('=' .repeat(40));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/test-endpoint';
    const testData = {
        test: 'data',
        timestamp: new Date().toISOString()
    };
    
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
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Simple test endpoint is working');
            console.log(`Message: ${result.message}`);
            console.log(`Timestamp: ${result.timestamp}`);
            console.log(`Request data received: ${JSON.stringify(result.request_data)}`);
            
            console.log('\n🎯 This proves:');
            console.log('   ✅ POST routes CAN be registered');
            console.log('   ✅ Our controller methods CAN be called');
            console.log('   ✅ Authentication is working');
            console.log('   ❓ The issue is specific to bulk endpoints');
            
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Failed: ${errorText}`);
            
            if (response.status === 404) {
                console.log('\n💡 This suggests:');
                console.log('   ❌ The updated plugin wasn\'t uploaded correctly');
                console.log('   ❌ There\'s a PHP syntax error preventing route registration');
            }
            
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testBulkAfterSimple() {
    console.log('\n🔧 Testing Bulk Endpoints After Simple Success');
    console.log('=' .repeat(50));
    
    const bulkEndpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory'
    ];
    
    const testData = {
        product_ids: [792],
        location_id: 30
    };
    
    for (const endpoint of bulkEndpoints) {
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
            
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ SUCCESS! ${Object.keys(result).length} products returned`);
                return true;
            } else if (response.status === 400) {
                const errorText = await response.text();
                console.log(`   ⚠️  Validation error: ${errorText.substring(0, 100)}...`);
                console.log('   This means the endpoint is reachable!');
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    return false;
}

async function main() {
    const simpleWorked = await testSimpleEndpoint();
    
    if (simpleWorked) {
        console.log('\n🎯 Simple endpoint works! Now testing bulk endpoints...');
        const bulkWorked = await testBulkAfterSimple();
        
        if (!bulkWorked) {
            console.log('\n🔍 DIAGNOSIS:');
            console.log('   ✅ POST routes work in general');
            console.log('   ❌ Bulk endpoints specifically don\'t work');
            console.log('   💡 Likely issue: callback method name or argument validation');
        }
    } else {
        console.log('\n🔍 DIAGNOSIS:');
        console.log('   ❌ Even simple POST routes don\'t work');
        console.log('   💡 Likely issue: plugin upload or PHP syntax error');
    }
}

// Run the test
main().catch(console.error);