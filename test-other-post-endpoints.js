/**
 * Test other POST endpoints to isolate the bulk inventory issue
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Test the bulk-update endpoint (which should work)
 */
async function testBulkUpdateEndpoint() {
    console.log('🧪 Testing stock/bulk-update endpoint...');
    
    const testData = {
        updates: [
            {
                inventory_id: 8337, // Chilled Cherries inventory
                quantity: 0.1,
                operation: 'add'
            }
        ]
    };
    
    try {
        const endpoint = `/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ bulk-update works!');
            console.log('📄 Result:', JSON.stringify(result, null, 2));
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ bulk-update failed: ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ bulk-update error: ${error.message}`);
        return false;
    }
}

/**
 * Test creating inventory (POST endpoint)
 */
async function testCreateInventoryEndpoint() {
    console.log('\n🧪 Testing create inventory endpoint...');
    
    const testData = {
        location_id: 30, // Charlotte Monroe
        quantity: 1,
        name: 'Test Inventory'
    };
    
    try {
        const endpoint = `/wp-json/wc/v3/addify_headless_inventory/products/792/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ create inventory works!');
            console.log('📄 Result:', JSON.stringify(result, null, 2));
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ create inventory failed: ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ create inventory error: ${error.message}`);
        return false;
    }
}

/**
 * Test the exact bulk endpoint with different data formats
 */
async function testBulkEndpointVariations() {
    console.log('\n🧪 Testing bulk inventory endpoint variations...');
    
    const variations = [
        {
            name: 'Array format',
            data: {
                product_ids: [792, 756, 765],
                location_id: 30
            }
        },
        {
            name: 'String array format',
            data: {
                product_ids: ['792', '756', '765'],
                location_id: '30'
            }
        },
        {
            name: 'Without location_id',
            data: {
                product_ids: [792, 756, 765]
            }
        },
        {
            name: 'Single product',
            data: {
                product_ids: [792],
                location_id: 30
            }
        }
    ];
    
    for (const variation of variations) {
        console.log(`\n🔍 Testing ${variation.name}...`);
        
        try {
            const endpoint = `/wp-json/wc/v3/addify_headless_inventory/inventory/bulk?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(variation.data)
            });
            
            console.log(`📡 Response: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${variation.name} works!`);
                console.log('📄 Sample result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
                return result;
            } else {
                const error = await response.text();
                console.log(`❌ ${variation.name} failed: ${error.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`❌ ${variation.name} error: ${error.message}`);
        }
    }
    
    return null;
}

/**
 * Check if the plugin is properly loaded
 */
async function checkPluginStatus() {
    console.log('\n🔌 Checking plugin status...');
    
    try {
        // Check if we can access the basic locations endpoint
        const endpoint = `/wp-json/wc/v3/addify_headless_inventory/locations?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        const response = await fetch(`${API_BASE}${endpoint}`);
        
        if (response.ok) {
            const locations = await response.json();
            console.log(`✅ Plugin loaded: ${locations.length} locations found`);
            return true;
        } else {
            console.log(`❌ Plugin issue: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Plugin check error: ${error.message}`);
        return false;
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('🔍 Testing Other POST Endpoints to Isolate Bulk Issue');
    console.log('=' .repeat(60));
    
    // Check plugin status
    const pluginOk = await checkPluginStatus();
    
    if (!pluginOk) {
        console.log('❌ Plugin not properly loaded, stopping tests');
        return;
    }
    
    // Test other POST endpoints
    const bulkUpdateWorks = await testBulkUpdateEndpoint();
    const createInventoryWorks = await testCreateInventoryEndpoint();
    
    // Test bulk endpoint variations
    const bulkResult = await testBulkEndpointVariations();
    
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(40));
    console.log(`Plugin loaded: ${pluginOk ? '✅' : '❌'}`);
    console.log(`bulk-update endpoint: ${bulkUpdateWorks ? '✅' : '❌'}`);
    console.log(`create inventory endpoint: ${createInventoryWorks ? '✅' : '❌'}`);
    console.log(`bulk inventory endpoint: ${bulkResult ? '✅' : '❌'}`);
    
    if (!bulkResult && (bulkUpdateWorks || createInventoryWorks)) {
        console.log('\n🎯 CONCLUSION: Issue is specific to the bulk inventory endpoint');
        console.log('   Other POST endpoints work, so authentication and plugin loading are OK');
        console.log('   The bulk endpoint registration or implementation has a bug');
    }
}

main().catch(console.error);