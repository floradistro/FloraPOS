/**
 * Debug WordPress routing issue - check exact route patterns
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function debugWordPressRouting() {
    console.log('🔍 WordPress Routing Debug');
    console.log('=' .repeat(40));
    
    try {
        // Get the complete route information
        const response = await fetch(`${API_BASE}/wp-json/wc/v3?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`);
        const apiData = await response.json();
        
        console.log('\n📋 Analyzing route registration patterns...');
        
        // Find our bulk-inventory route
        const bulkRoute = apiData.routes['/wc/v3/addify_headless_inventory/bulk-inventory'];
        
        if (bulkRoute) {
            console.log('\n✅ Found bulk-inventory route in API index:');
            console.log(JSON.stringify(bulkRoute, null, 2));
            
            // Compare with a working route
            const workingRoute = apiData.routes['/wc/v3/addify_headless_inventory/products/(?P<product_id>[\\d]+)/inventory'];
            
            if (workingRoute) {
                console.log('\n📋 Comparing with working route:');
                console.log(JSON.stringify(workingRoute, null, 2));
                
                console.log('\n🔍 Key differences:');
                console.log('Bulk route methods:', bulkRoute.methods);
                console.log('Working route methods:', workingRoute.methods);
                
                // Check if the route patterns are different
                console.log('\n🔗 Route pattern analysis:');
                console.log('Bulk route has parameters:', bulkRoute.args ? Object.keys(bulkRoute.args) : 'none');
                console.log('Working route has parameters:', workingRoute.args ? Object.keys(workingRoute.args) : 'none');
            }
        } else {
            console.log('❌ bulk-inventory route not found in API index');
        }
        
        // Test if the issue is with the exact URL format
        console.log('\n🧪 Testing different URL formats...');
        
        const urlVariations = [
            `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/bulk-inventory`,
            `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/bulk-inventory/`,
            `${API_BASE}/index.php/wp-json/wc/v3/addify_headless_inventory/bulk-inventory`,
        ];
        
        for (const url of urlVariations) {
            try {
                const testResponse = await fetch(`${url}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`, {
                    method: 'OPTIONS'
                });
                
                console.log(`${url}: ${testResponse.status} ${testResponse.statusText}`);
                
                if (testResponse.ok) {
                    const headers = {};
                    testResponse.headers.forEach((value, key) => {
                        if (key.toLowerCase().includes('allow') || key.toLowerCase().includes('method')) {
                            headers[key] = value;
                        }
                    });
                    console.log('  Headers:', headers);
                }
            } catch (error) {
                console.log(`${url}: Error - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Run the debug
debugWordPressRouting().catch(console.error);