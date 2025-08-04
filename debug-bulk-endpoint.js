/**
 * Debug script to test the bulk inventory endpoint specifically
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Test different authentication methods for POST requests
 */
async function testBulkEndpointAuth() {
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    console.log('🔍 Testing Bulk Inventory Endpoint Authentication Methods');
    console.log('=' .repeat(60));
    
    // Method 1: URL Parameters (current approach)
    console.log('\n1️⃣ Testing with URL Parameters...');
    try {
        const endpoint = `/wp-json/wc/v3/addify_headless_inventory/inventory/bulk?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`📄 Body: ${text.substring(0, 200)}...`);
        
        if (response.ok) {
            console.log('✅ URL Parameters method works!');
            return JSON.parse(text);
        }
    } catch (error) {
        console.log(`❌ URL Parameters failed: ${error.message}`);
    }
    
    // Method 2: Basic Auth Header
    console.log('\n2️⃣ Testing with Basic Auth Header...');
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const response = await fetch(`${API_BASE}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`📄 Body: ${text.substring(0, 200)}...`);
        
        if (response.ok) {
            console.log('✅ Basic Auth method works!');
            return JSON.parse(text);
        }
    } catch (error) {
        console.log(`❌ Basic Auth failed: ${error.message}`);
    }
    
    // Method 3: Check if endpoint exists at all
    console.log('\n3️⃣ Testing if endpoint exists (OPTIONS request)...');
    try {
        const response = await fetch(`${API_BASE}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`, {
            method: 'OPTIONS'
        });
        
        console.log(`📡 OPTIONS Response: ${response.status} ${response.statusText}`);
        console.log(`📄 Headers:`, Object.fromEntries(response.headers.entries()));
    } catch (error) {
        console.log(`❌ OPTIONS failed: ${error.message}`);
    }
    
    return null;
}

/**
 * Test if the route is registered by checking the WordPress REST API index
 */
async function checkAPIRoutes() {
    console.log('\n🗺️  Checking Available API Routes');
    console.log('=' .repeat(60));
    
    try {
        const response = await fetch(`${API_BASE}/wp-json/wc/v3/?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ WooCommerce v3 API accessible');
            console.log(`📊 Available routes: ${Object.keys(data.routes || {}).length}`);
            
            // Look for addify routes
            const addifyRoutes = Object.keys(data.routes || {}).filter(route => 
                route.includes('addify') || route.includes('inventory')
            );
            
            if (addifyRoutes.length > 0) {
                console.log('🏪 Found Addify-related routes:');
                addifyRoutes.forEach(route => console.log(`  - ${route}`));
            } else {
                console.log('❌ No Addify routes found in WooCommerce API');
            }
        } else {
            console.log(`❌ Cannot access WooCommerce API: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Failed to check API routes: ${error.message}`);
    }
}

/**
 * Test alternative bulk approach using individual product requests
 */
async function testAlternativeBulkApproach(productIds, locationId) {
    console.log('\n🔄 Testing Alternative Bulk Approach (Individual Requests)');
    console.log('=' .repeat(60));
    
    const results = {};
    
    for (const productId of productIds) {
        try {
            const endpoint = `/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(`${API_BASE}${endpoint}`);
            
            if (response.ok) {
                const inventory = await response.json();
                
                // Filter by location if specified
                const locationInventory = locationId 
                    ? inventory.filter(inv => inv.location_id == locationId)
                    : inventory;
                
                if (locationInventory.length > 0) {
                    results[productId] = locationInventory;
                    console.log(`✅ Product ${productId}: ${locationInventory.length} inventory records`);
                } else {
                    console.log(`⚠️  Product ${productId}: No inventory at location ${locationId}`);
                }
            } else {
                console.log(`❌ Product ${productId}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ Product ${productId}: ${error.message}`);
        }
    }
    
    return results;
}

/**
 * Main debug function
 */
async function main() {
    console.log('🐛 Bulk Inventory Endpoint Debug');
    console.log('=' .repeat(60));
    
    // Test different auth methods
    const bulkResult = await testBulkEndpointAuth();
    
    // Check available routes
    await checkAPIRoutes();
    
    // Test alternative approach
    const alternativeResult = await testAlternativeBulkApproach([792, 756, 765], 30);
    
    console.log('\n📊 Results Summary:');
    console.log(`Bulk endpoint working: ${bulkResult ? '✅ Yes' : '❌ No'}`);
    console.log(`Alternative approach: ${Object.keys(alternativeResult).length > 0 ? '✅ Yes' : '❌ No'}`);
    
    if (Object.keys(alternativeResult).length > 0) {
        console.log('\n📦 Alternative Bulk Results:');
        Object.entries(alternativeResult).forEach(([productId, inventories]) => {
            console.log(`Product ${productId}:`);
            inventories.forEach(inv => {
                console.log(`  - ${inv.location_name}: ${inv.quantity} units`);
            });
        });
    }
}

// Run the debug
main().catch(console.error);