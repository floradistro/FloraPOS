/**
 * PRODUCTION READY: Charlotte Monroe Bulk Inventory Fetcher
 * Uses individual requests as workaround for bulk endpoint issues
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';
const CHARLOTTE_LOCATION_ID = 30; // Charlotte Monroe 28205

/**
 * Make authenticated API request
 */
async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FloraDistro-POS/1.0'
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Get bulk inventory for multiple products efficiently
 */
async function getBulkInventory(productIds, locationId = CHARLOTTE_LOCATION_ID) {
    console.log(`🔍 Fetching inventory for ${productIds.length} products at location ${locationId}`);
    
    const startTime = Date.now();
    const results = {};
    const errors = [];
    
    // Process requests in parallel for efficiency
    const promises = productIds.map(async (productId) => {
        try {
            const endpoint = `/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`;
            const inventory = await makeAPIRequest(endpoint);
            
            // Filter for the specific location and items with stock > 0
            const locationInventory = inventory.filter(item => 
                item.location_id == locationId && parseFloat(item.quantity) > 0
            );
            
            if (locationInventory.length > 0) {
                results[productId] = locationInventory;
            }
            
            return { productId, success: true, count: locationInventory.length };
        } catch (error) {
            errors.push({ productId, error: error.message });
            return { productId, success: false, error: error.message };
        }
    });
    
    // Wait for all requests to complete
    const requestResults = await Promise.all(promises);
    const endTime = Date.now();
    
    // Calculate statistics
    const successful = requestResults.filter(r => r.success).length;
    const failed = requestResults.filter(r => !r.success).length;
    const totalItems = Object.values(results).reduce((sum, items) => sum + items.length, 0);
    
    console.log(`\n📊 Bulk Inventory Results:`);
    console.log(`   ⏱️  Total time: ${endTime - startTime}ms`);
    console.log(`   ✅ Successful requests: ${successful}/${productIds.length}`);
    console.log(`   ❌ Failed requests: ${failed}`);
    console.log(`   📦 Products with inventory: ${Object.keys(results).length}`);
    console.log(`   📋 Total inventory items: ${totalItems}`);
    
    if (errors.length > 0) {
        console.log(`\n⚠️  Errors:`);
        errors.forEach(error => {
            console.log(`   Product ${error.productId}: ${error.error}`);
        });
    }
    
    return {
        success: true,
        data: results,
        statistics: {
            totalTime: endTime - startTime,
            requestCount: productIds.length,
            successfulRequests: successful,
            failedRequests: failed,
            productsWithInventory: Object.keys(results).length,
            totalInventoryItems: totalItems
        },
        errors
    };
}

/**
 * Get all products and their inventory
 */
async function getAllProductsInventory(limit = 50) {
    console.log(`🔍 Getting all products (limit: ${limit}) and their inventory`);
    
    try {
        // Get products from WooCommerce
        const products = await makeAPIRequest(`/wp-json/wc/v3/products?per_page=${limit}&status=publish`);
        console.log(`✅ Found ${products.length} published products`);
        
        if (products.length === 0) {
            return { success: false, message: 'No products found' };
        }
        
        // Extract product IDs
        const productIds = products.map(product => product.id);
        
        // Get bulk inventory
        const inventoryResult = await getBulkInventory(productIds);
        
        // Enhance results with product names
        const enhancedData = {};
        Object.keys(inventoryResult.data).forEach(productId => {
            const product = products.find(p => p.id == productId);
            enhancedData[productId] = {
                product_name: product ? product.name : `Product ${productId}`,
                product_sku: product ? product.sku : null,
                inventory: inventoryResult.data[productId]
            };
        });
        
        return {
            ...inventoryResult,
            data: enhancedData
        };
        
    } catch (error) {
        console.log(`❌ Error getting products: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Display inventory results in a readable format
 */
function displayInventoryResults(result) {
    if (!result.success) {
        console.log(`❌ Failed to get inventory: ${result.error || result.message}`);
        return;
    }
    
    console.log(`\n📋 Charlotte Monroe Inventory Report`);
    console.log(`${'='.repeat(50)}`);
    
    const sortedProducts = Object.entries(result.data).sort((a, b) => {
        const nameA = a[1].product_name || `Product ${a[0]}`;
        const nameB = b[1].product_name || `Product ${b[0]}`;
        return nameA.localeCompare(nameB);
    });
    
    sortedProducts.forEach(([productId, productData]) => {
        const productName = productData.product_name || `Product ${productId}`;
        const sku = productData.product_sku ? ` (${productData.product_sku})` : '';
        
        console.log(`\n🏷️  ${productName}${sku}`);
        console.log(`   Product ID: ${productId}`);
        
        const inventory = productData.inventory || productData;
        if (Array.isArray(inventory)) {
            inventory.forEach(item => {
                console.log(`   📦 ${item.quantity} units - ${item.location_name || `Location ${item.location_id}`}`);
                if (item.name && item.name !== item.location_name) {
                    console.log(`      Name: ${item.name}`);
                }
            });
        }
    });
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Products with inventory: ${Object.keys(result.data).length}`);
    console.log(`   Total inventory items: ${result.statistics.totalInventoryItems}`);
    console.log(`   Processing time: ${result.statistics.totalTime}ms`);
    console.log(`   API requests: ${result.statistics.requestCount}`);
}

/**
 * Main function - can be called with specific product IDs or get all
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] !== 'all') {
        // Specific product IDs provided
        const productIds = args.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (productIds.length === 0) {
            console.log('❌ Please provide valid product IDs or use "all"');
            console.log('Usage: node charlotte-bulk-inventory-final.js [product_id1] [product_id2] ... or "all"');
            return;
        }
        
        console.log('🎯 Fetching inventory for specific products:', productIds.join(', '));
        const result = await getBulkInventory(productIds);
        displayInventoryResults(result);
        
    } else {
        // Get all products
        const limit = args[0] === 'all' && args[1] ? parseInt(args[1]) : 50;
        const result = await getAllProductsInventory(limit);
        displayInventoryResults(result);
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getBulkInventory,
        getAllProductsInventory,
        makeAPIRequest,
        displayInventoryResults
    };
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}