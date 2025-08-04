/**
 * Test basic API functionality to see if there's a broader issue
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testBasicAPI() {
    console.log('🧪 Testing Basic API Functionality');
    console.log('=' .repeat(40));
    
    // Test 1: WordPress REST API root
    console.log('\n1️⃣ Testing WordPress REST API root');
    try {
        const response = await fetch(`${API_BASE}/wp-json/`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ WordPress REST API is working`);
            console.log(`   Authentication: ${data.authentication ? 'Available' : 'Not available'}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 2: WooCommerce API root
    console.log('\n2️⃣ Testing WooCommerce API root');
    try {
        const url = `${API_BASE}/wp-json/wc/v3?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log(`   ✅ WooCommerce API is working`);
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 3: Any Addify endpoints
    console.log('\n3️⃣ Testing any Addify endpoints');
    const addifyEndpoints = [
        '/wp-json/wc/v3/addify_headless_inventory',
        '/wp-json/wc/v3/addify_headless_inventory/locations',
        '/wp-json/wc/v3/addify_headless_inventory/products/792/inventory'
    ];
    
    for (const endpoint of addifyEndpoints) {
        try {
            const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(url);
            console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log(`     ✅ Working`);
            } else if (response.status === 404) {
                console.log(`     ❌ Not found - plugin may not be loaded`);
            } else {
                console.log(`     ⚠️  Other error`);
            }
        } catch (error) {
            console.log(`   ${endpoint}: Error - ${error.message}`);
        }
    }
    
    // Test 4: Check if we can create a simple inventory item (to confirm plugin is working)
    console.log('\n4️⃣ Testing plugin functionality');
    try {
        const url = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/products/792/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location_id: 30,
                quantity: 0.001,
                name: 'Syntax Test'
            })
        });
        
        console.log(`   Create inventory: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log(`   ✅ Plugin is working - can create inventory`);
        } else if (response.status === 404) {
            console.log(`   ❌ Plugin endpoints not found - upload issue or syntax error`);
        } else {
            console.log(`   ⚠️  Plugin loaded but other error`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

// Run the test
testBasicAPI().catch(console.error);