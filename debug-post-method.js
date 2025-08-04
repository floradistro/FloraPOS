/**
 * Debug POST method handling specifically
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Test different HTTP methods on the bulk endpoints
 */
async function testHTTPMethods() {
    console.log('🔍 Testing Different HTTP Methods on Bulk Endpoints');
    console.log('=' .repeat(60));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'];
    
    for (const method of methods) {
        console.log(`\n🧪 Testing ${method} method...`);
        
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FloraDistro-Method-Test/1.0'
                }
            };
            
            if (method !== 'GET' && method !== 'OPTIONS') {
                config.body = JSON.stringify(testData);
            }
            
            const response = await fetch(url, config);
            const responseText = await response.text();
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
            
            if (response.status === 200 || response.status === 201) {
                console.log(`   ✅ ${method} works! Response: ${responseText.substring(0, 100)}...`);
            } else if (response.status === 405) {
                console.log(`   ⚠️  ${method} not allowed (expected for some methods)`);
            } else if (response.status === 404) {
                console.log(`   ❌ ${method} returns 404 - route not found for this method`);
            } else {
                console.log(`   ❓ ${method} returns ${response.status}: ${responseText.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${method} failed: ${error.message}`);
        }
    }
}

/**
 * Test a working POST endpoint for comparison
 */
async function testWorkingPOSTEndpoint() {
    console.log('\n🧪 Testing Working POST Endpoint for Comparison');
    console.log('=' .repeat(60));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/products/792/inventory';
    const testData = {
        location_id: 30,
        quantity: 1,
        name: 'Debug Test Inventory'
    };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-Working-Test/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        const responseText = await response.text();
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Response length: ${responseText.length} characters`);
        
        if (response.ok) {
            console.log('✅ Working POST endpoint responds correctly');
            console.log(`Sample response: ${responseText.substring(0, 200)}...`);
        } else {
            console.log('❌ Even working POST endpoint is failing');
            console.log(`Error: ${responseText}`);
        }
        
    } catch (error) {
        console.log(`❌ Working POST test failed: ${error.message}`);
    }
}

/**
 * Test with different authentication methods
 */
async function testAuthenticationMethods() {
    console.log('\n🔐 Testing Different Authentication Methods');
    console.log('=' .repeat(60));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk';
    const testData = {
        product_ids: [792],
        location_id: 30
    };
    
    // Method 1: URL Parameters
    console.log('🧪 Testing URL Parameters auth...');
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        console.log(`   URL Params: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`   URL Params error: ${error.message}`);
    }
    
    // Method 2: Basic Auth Header
    console.log('🧪 Testing Basic Auth header...');
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        console.log(`   Basic Auth: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`   Basic Auth error: ${error.message}`);
    }
    
    // Method 3: Form Data
    console.log('🧪 Testing form data...');
    try {
        const formData = new URLSearchParams();
        formData.append('consumer_key', CONSUMER_KEY);
        formData.append('consumer_secret', CONSUMER_SECRET);
        formData.append('product_ids', JSON.stringify([792]));
        formData.append('location_id', '30');
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        console.log(`   Form Data: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`   Form Data error: ${error.message}`);
    }
}

/**
 * Check if the issue is with the specific callback method
 */
async function testCallbackMethod() {
    console.log('\n🔧 Testing Callback Method Accessibility');
    console.log('=' .repeat(60));
    
    // The issue might be that the get_bulk_inventory method has an error
    // Let's try to trigger it in a way that would show the error
    
    console.log('Testing if callback methods exist and are accessible...');
    
    // We can't directly test the PHP methods from JavaScript,
    // but we can test if the route registration worked by checking
    // if we get a different error when we send malformed data
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk';
    
    const testCases = [
        {
            name: 'Empty body',
            data: {}
        },
        {
            name: 'Invalid product_ids',
            data: { product_ids: 'invalid' }
        },
        {
            name: 'Missing required fields',
            data: { location_id: 30 }
        },
        {
            name: 'Valid data',
            data: { product_ids: [792], location_id: 30 }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testCase.data)
            });
            
            const responseText = await response.text();
            console.log(`   Status: ${response.status}`);
            
            if (response.status === 400) {
                console.log('   ✅ Got 400 - callback method is being reached (validation error)');
                console.log(`   Validation error: ${responseText.substring(0, 100)}...`);
            } else if (response.status === 404) {
                console.log('   ❌ Still 404 - route not found');
            } else if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Success! Method is working');
                console.log(`   Response: ${responseText.substring(0, 100)}...`);
            } else {
                console.log(`   ❓ Unexpected status: ${responseText.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
}

/**
 * Main debug function
 */
async function main() {
    console.log('🐛 Debugging POST Method Handling for Bulk Endpoints');
    console.log('=' .repeat(70));
    console.log('Investigating why POST requests return 404 when routes are registered');
    console.log('');
    
    // Test different HTTP methods
    await testHTTPMethods();
    
    // Test a working POST endpoint for comparison
    await testWorkingPOSTEndpoint();
    
    // Test different authentication methods
    await testAuthenticationMethods();
    
    // Test callback method accessibility
    await testCallbackMethod();
    
    console.log('\n📊 Debug Summary');
    console.log('=' .repeat(30));
    console.log('If all methods return 404, the issue is route registration.');
    console.log('If only POST returns 404, the issue is method-specific.');
    console.log('If we get 400 errors, the callback is being reached.');
    console.log('If working POST fails too, there might be a server issue.');
}

// Run the debug
main().catch(console.error);