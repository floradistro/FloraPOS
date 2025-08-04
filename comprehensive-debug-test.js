/**
 * Comprehensive debug test to identify the exact issue with bulk endpoints
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Test with different authentication and request formats
 */
async function comprehensiveTest() {
    console.log('🔧 Comprehensive Debug Test for Bulk Endpoints');
    console.log('=' .repeat(60));
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    // Test 1: URL Parameters with different Content-Types
    console.log('\n1️⃣ Testing URL Parameters with different Content-Types');
    const contentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
    ];
    
    for (const contentType of contentTypes) {
        console.log(`\n🧪 Content-Type: ${contentType}`);
        
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            
            let body;
            let headers = { 'User-Agent': 'FloraDistro-Debug/1.0' };
            
            if (contentType === 'application/json') {
                body = JSON.stringify(testData);
                headers['Content-Type'] = contentType;
            } else if (contentType === 'application/x-www-form-urlencoded') {
                const formData = new URLSearchParams();
                formData.append('product_ids', JSON.stringify(testData.product_ids));
                formData.append('location_id', testData.location_id.toString());
                body = formData.toString();
                headers['Content-Type'] = contentType;
            } else {
                body = JSON.stringify(testData);
                headers['Content-Type'] = contentType;
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`   ✅ SUCCESS! Products returned: ${Object.keys(result).length}`);
                return { success: true, method: `URL params + ${contentType}`, result };
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Test 2: Basic Auth with different formats
    console.log('\n2️⃣ Testing Basic Auth');
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-Debug/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ SUCCESS! Products returned: ${Object.keys(result).length}`);
            return { success: true, method: 'Basic Auth', result };
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 3: Test with minimal data
    console.log('\n3️⃣ Testing with minimal data');
    const minimalData = { product_ids: [792] };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-Debug/1.0'
            },
            body: JSON.stringify(minimalData)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ SUCCESS! Products returned: ${Object.keys(result).length}`);
            return { success: true, method: 'Minimal data', result };
        } else if (response.status === 400) {
            const errorText = await response.text();
            console.log(`   ⚠️  Validation error (good - means endpoint is reachable): ${errorText.substring(0, 100)}...`);
            return { success: 'validation_error', method: 'Minimal data', error: errorText };
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 4: Test all our endpoints
    console.log('\n4️⃣ Testing all bulk endpoints');
    const endpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
        '/wp-json/wc/v3/addify_headless_inventory/inventory-bulk',
        '/wp-json/wc/v3/addify_headless_inventory/get-bulk-inventory'
    ];
    
    for (const testEndpoint of endpoints) {
        console.log(`\n🔍 Testing: ${testEndpoint}`);
        
        try {
            const url = `${API_BASE}${testEndpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
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
                console.log(`   ✅ SUCCESS! Products returned: ${Object.keys(result).length}`);
                return { success: true, method: testEndpoint, result };
            } else if (response.status === 400) {
                const errorText = await response.text();
                console.log(`   ⚠️  Validation error: ${errorText.substring(0, 100)}...`);
                return { success: 'validation_error', method: testEndpoint, error: errorText };
            } else {
                const errorText = await response.text();
                console.log(`   ❌ ${response.status}: ${errorText.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    // Test 5: Check if it's a method issue by testing with GET (should fail properly)
    console.log('\n5️⃣ Testing with GET method (should give proper error)');
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&product_ids=${JSON.stringify([792])}&location_id=30`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'FloraDistro-Debug/1.0'
            }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        
        if (response.status === 405) {
            console.log(`   ✅ Proper 405 Method Not Allowed - endpoint exists but doesn't accept GET`);
        } else if (response.status === 404) {
            console.log(`   ❌ 404 - endpoint not found at all`);
        } else {
            console.log(`   ❓ Unexpected: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    return { success: false };
}

/**
 * Test working endpoint for comparison
 */
async function testWorkingEndpoint() {
    console.log('\n🧪 Testing Working Endpoint for Comparison');
    console.log('=' .repeat(50));
    
    const workingEndpoint = '/wp-json/wc/v3/addify_headless_inventory/products/792/inventory';
    const workingData = {
        location_id: 30,
        quantity: 0.001,
        name: 'Debug Test'
    };
    
    try {
        const url = `${API_BASE}${workingEndpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-Debug/1.0'
            },
            body: JSON.stringify(workingData)
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log('✅ Working endpoint still works - authentication is fine');
            return true;
        } else {
            console.log('❌ Working endpoint also failing - broader issue');
            const errorText = await response.text();
            console.log(`Error: ${errorText.substring(0, 200)}...`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Working endpoint test failed: ${error.message}`);
        return false;
    }
}

/**
 * Main test function
 */
async function main() {
    // Test working endpoint first
    const workingEndpointOk = await testWorkingEndpoint();
    
    if (!workingEndpointOk) {
        console.log('\n❌ CRITICAL: Even working endpoints are failing');
        console.log('This suggests a broader authentication or server issue');
        return;
    }
    
    // Run comprehensive test
    const result = await comprehensiveTest();
    
    console.log('\n📊 Comprehensive Test Results');
    console.log('=' .repeat(40));
    
    if (result.success === true) {
        console.log('🎉 SUCCESS! Found working method:');
        console.log(`   Method: ${result.method}`);
        console.log(`   Products returned: ${Object.keys(result.result).length}`);
        
        // Show sample result
        const firstProduct = Object.keys(result.result)[0];
        if (firstProduct && result.result[firstProduct][0]) {
            const sample = result.result[firstProduct][0];
            console.log(`   Sample: Product ${firstProduct} - ${sample.quantity} units at ${sample.location_name}`);
        }
    } else if (result.success === 'validation_error') {
        console.log('⚠️  PROGRESS: Endpoint is reachable but has validation issues');
        console.log(`   Method: ${result.method}`);
        console.log(`   Error: ${result.error.substring(0, 200)}...`);
        console.log('   This means the route registration is working!');
    } else {
        console.log('❌ No bulk endpoints are working with any method');
        console.log('   The issue is likely in the route registration or callback method');
    }
    
    console.log('\n💡 Next Steps:');
    if (result.success === true) {
        console.log('   Use the working method for production');
    } else if (result.success === 'validation_error') {
        console.log('   Fix the validation issue in the callback method');
    } else {
        console.log('   1. Check WordPress error logs for PHP errors');
        console.log('   2. Verify the plugin files were uploaded correctly');
        console.log('   3. Try deactivating/reactivating the plugin');
        console.log('   4. Check for conflicting plugins');
    }
}

// Run the comprehensive test
main().catch(console.error);