/**
 * Test the ultra-simple endpoint to isolate the issue
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testUltraSimple() {
    console.log('🧪 Testing Ultra Simple Endpoint');
    console.log('=' .repeat(40));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/test-simple';
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        console.log(`🔗 URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-UltraSimple/1.0'
            },
            body: JSON.stringify({test: 'data'})
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Ultra simple endpoint is working!');
            console.log('📋 Result:', JSON.stringify(result, null, 2));
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return false;
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return false;
    }
}

async function testSimpleBulkFixed() {
    console.log('\n🧪 Testing Simple Bulk Fixed Endpoint');
    console.log('=' .repeat(45));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/simple-bulk';
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        console.log(`🔗 URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-SimpleBulkFixed/1.0'
            },
            body: JSON.stringify({
                product_ids: [792, 756],
                location_id: 30
            })
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Simple bulk fixed endpoint is working!');
            console.log('📋 Result:', JSON.stringify(result, null, 2));
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return false;
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing Simplified Endpoints');
    console.log('Upload the updated plugin before running this test!');
    console.log('=' .repeat(60));
    
    const ultraSimpleWorks = await testUltraSimple();
    const simpleBulkWorks = await testSimpleBulkFixed();
    
    console.log('\n📊 Summary');
    console.log('=' .repeat(20));
    
    if (ultraSimpleWorks && simpleBulkWorks) {
        console.log('🎉 BOTH endpoints are working!');
        console.log('✅ The plugin upload and route registration is successful!');
    } else if (ultraSimpleWorks) {
        console.log('⚠️  Ultra simple works but bulk doesn\'t');
        console.log('💡 Issue is with the bulk endpoint callback or parameters');
    } else {
        console.log('❌ Neither endpoint is working');
        console.log('💡 Plugin upload issue or WordPress caching');
    }
}

// Run the test
main().catch(console.error);