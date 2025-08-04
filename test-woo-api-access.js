/**
 * Test WooCommerce API access and explore available endpoints
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * Make authenticated API request
 */
async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const config = {
        method: method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'FloraDistro-Test/1.0'
        }
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        console.log(`🔍 Testing: ${method} ${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Error: ${errorText}`);
            return null;
        }
        
        const data = await response.json();
        console.log(`✅ Success: Received ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
        return data;
    } catch (error) {
        console.error(`❌ Request failed: ${error.message}`);
        return null;
    }
}

/**
 * Test basic WooCommerce endpoints
 */
async function testBasicEndpoints() {
    console.log('\n🧪 Testing Basic WooCommerce Endpoints');
    console.log('=' .repeat(50));
    
    // Test system status
    await makeAPIRequest('/wp-json/wc/v3/system_status');
    
    // Test products (limited)
    const products = await makeAPIRequest('/wp-json/wc/v3/products?per_page=5');
    if (products && products.length > 0) {
        console.log(`📦 Sample products found:`);
        products.forEach(product => {
            console.log(`  - ${product.name} (ID: ${product.id}, SKU: ${product.sku || 'N/A'})`);
        });
    }
    
    // Test product categories
    await makeAPIRequest('/wp-json/wc/v3/products/categories?per_page=5');
    
    return products;
}

/**
 * Test Addify-specific endpoints
 */
async function testAddifyEndpoints() {
    console.log('\n🏪 Testing Addify Multi-Location Inventory Endpoints');
    console.log('=' .repeat(50));
    
    // Try different possible endpoint variations
    const endpoints = [
        '/wp-json/wc/v3/addify_headless_inventory/locations',
        '/wp-json/addify/v1/locations',
        '/wp-json/mli/v1/locations',
        '/wp-json/wc/v3/mli/locations',
        '/wp-json/wc/v3/addify/locations'
    ];
    
    for (const endpoint of endpoints) {
        await makeAPIRequest(endpoint);
    }
}

/**
 * Test WordPress core endpoints
 */
async function testWordPressEndpoints() {
    console.log('\n🔧 Testing WordPress Core Endpoints');
    console.log('=' .repeat(50));
    
    // Test basic WP endpoints
    await makeAPIRequest('/wp-json/wp/v2/posts?per_page=1');
    await makeAPIRequest('/wp-json/');
    
    // Test custom taxonomies (Addify locations might be here)
    await makeAPIRequest('/wp-json/wp/v2/mli_location');
}

/**
 * Try to find products with multi-location inventory
 */
async function findMultiLocationProducts() {
    console.log('\n🔍 Searching for Multi-Location Inventory Products');
    console.log('=' .repeat(50));
    
    // Get products and check their meta data
    const products = await makeAPIRequest('/wp-json/wc/v3/products?per_page=20');
    
    if (products && products.length > 0) {
        console.log('🔍 Checking products for multi-location inventory...');
        
        for (const product of products) {
            // Check if product has location-specific meta or indicates multi-inventory
            if (product.meta_data && product.meta_data.length > 0) {
                const multiInventoryMeta = product.meta_data.find(meta => 
                    meta.key.includes('mli') || 
                    meta.key.includes('multi') || 
                    meta.key.includes('location') ||
                    meta.key.includes('inventory')
                );
                
                if (multiInventoryMeta) {
                    console.log(`📦 Product "${product.name}" (ID: ${product.id}) has multi-location data:`);
                    console.log(`   Meta: ${multiInventoryMeta.key} = ${JSON.stringify(multiInventoryMeta.value)}`);
                }
            }
        }
    }
}

/**
 * Test with URL parameters approach
 */
async function testWithURLParams() {
    console.log('\n🔗 Testing with URL Parameters Authentication');
    console.log('=' .repeat(50));
    
    const endpoints = [
        `/wp-json/wc/v3/addify_headless_inventory/locations?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
        `/wp-json/wc/v3/products?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}&per_page=5`
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            console.log(`📡 ${endpoint.split('?')[0]}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success with URL params!`);
                return data;
            }
        } catch (error) {
            console.log(`❌ URL params failed: ${error.message}`);
        }
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('🚀 Flora Distro API Access Test');
    console.log('=' .repeat(60));
    console.log(`API Base: ${API_BASE}`);
    console.log(`Consumer Key: ${CONSUMER_KEY.substring(0, 15)}...`);
    console.log('=' .repeat(60));
    
    // Test basic WooCommerce access
    const products = await testBasicEndpoints();
    
    // Test Addify endpoints
    await testAddifyEndpoints();
    
    // Test WordPress endpoints
    await testWordPressEndpoints();
    
    // Search for multi-location products
    await findMultiLocationProducts();
    
    // Try URL parameter authentication
    await testWithURLParams();
    
    console.log('\n✅ API access test completed!');
}

// Run the test
main().catch(console.error);