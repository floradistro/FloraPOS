/**
 * Test the simple bulk endpoint with minimal registration
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testSimpleBulk() {
    console.log('🧪 Testing Simple Bulk Endpoint');
    console.log('=' .repeat(40));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/simple-bulk';
    const testData = {
        product_ids: [792],
        test: 'simple bulk test'
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
            console.log('✅ SUCCESS! Simple bulk endpoint is working');
            console.log(`Debug message: ${result.debug}`);
            console.log(`Timestamp: ${result.timestamp}`);
            console.log(`Request params: ${JSON.stringify(result.request_params)}`);
            
            console.log('\n🎯 This proves:');
            console.log('   ✅ The get_bulk_inventory method CAN be called');
            console.log('   ✅ Route registration IS working');
            console.log('   ✅ The issue was with the complex route patterns or args validation');
            
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Failed: ${errorText}`);
            
            if (response.status === 404) {
                console.log('\n💡 Still 404 - suggests:');
                console.log('   ❌ Plugin upload issue persists');
                console.log('   ❌ Or WordPress caching is very aggressive');
            }
            
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    const worked = await testSimpleBulk();
    
    if (worked) {
        console.log('\n🎉 BREAKTHROUGH!');
        console.log('The bulk inventory method works with simple registration!');
        console.log('The issue was likely with:');
        console.log('   - Complex argument validation');
        console.log('   - Permission callback complexity');
        console.log('   - Route pattern conflicts');
        console.log('\n🚀 Next: Simplify the production bulk endpoints');
    } else {
        console.log('\n❌ Still not working');
        console.log('This suggests a fundamental plugin upload or caching issue');
    }
}

// Run the test
main().catch(console.error);