/**
 * Test script to pull inventory from Charlotte Monroe 28205 location
 * Using Addify Multi-Location Inventory REST API
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Charlotte Monroe location ID (based on woocommerce-location-filter.php)
const CHARLOTTE_MONROE_LOCATION_ID = 30;

/**
 * Make authenticated API request using URL parameters
 */
async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    // Add authentication parameters to URL
    const separator = endpoint.includes('?') ? '&' : '?';
    const authenticatedEndpoint = `${endpoint}${separator}consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FloraDistro-POS/1.0'
        }
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${authenticatedEndpoint}`, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error.message);
        throw error;
    }
}

/**
 * Get all available locations from WordPress taxonomy
 */
async function getLocationsFromTaxonomy() {
    console.log('🏪 Fetching locations from WordPress taxonomy...');
    try {
        const locations = await makeAPIRequest('/wp-json/wp/v2/mli_location');
        console.log('📍 Available locations from taxonomy:');
        locations.forEach(location => {
            console.log(`  - ID: ${location.id}, Name: "${location.name}", Slug: ${location.slug}`);
        });
        return locations;
    } catch (error) {
        console.error('❌ Failed to fetch locations from taxonomy:', error.message);
        return [];
    }
}

/**
 * Get all available locations from Addify API
 */
async function getAllLocations() {
    console.log('🏪 Fetching all locations from Addify API...');
    try {
        const locations = await makeAPIRequest('/wp-json/wc/v3/addify_headless_inventory/locations');
        console.log('📍 Available locations from Addify API:');
        locations.forEach(location => {
            console.log(`  - ID: ${location.id}, Name: "${location.name}", Address: ${location.address || 'N/A'}`);
        });
        
        // Find Charlotte Monroe location
        const charlotteLocation = locations.find(loc => 
            loc.name.toLowerCase().includes('charlotte') && 
            loc.name.toLowerCase().includes('monroe')
        );
        
        if (charlotteLocation) {
            console.log(`✅ Found Charlotte Monroe location: ID ${charlotteLocation.id}`);
            return charlotteLocation.id;
        } else {
            console.log('⚠️  Charlotte Monroe location not found by name, using ID 30 from config');
            return CHARLOTTE_MONROE_LOCATION_ID;
        }
    } catch (error) {
        console.error('❌ Failed to fetch locations from Addify API:', error.message);
        
        // Fallback to taxonomy
        console.log('🔄 Trying WordPress taxonomy as fallback...');
        const taxonomyLocations = await getLocationsFromTaxonomy();
        
        // Find Charlotte Monroe in taxonomy
        const charlotteLocation = taxonomyLocations.find(loc => 
            loc.name.toLowerCase().includes('charlotte') && 
            loc.name.toLowerCase().includes('monroe')
        );
        
        if (charlotteLocation) {
            console.log(`✅ Found Charlotte Monroe in taxonomy: ID ${charlotteLocation.id}`);
            return charlotteLocation.id;
        }
        
        return CHARLOTTE_MONROE_LOCATION_ID;
    }
}

/**
 * Get inventory for Charlotte Monroe location
 */
async function getCharlotteInventory(locationId) {
    console.log(`\n📦 Fetching inventory for location ID: ${locationId}...`);
    try {
        const inventory = await makeAPIRequest(`/wp-json/wc/v3/addify_headless_inventory/locations/${locationId}/stock`);
        
        console.log(`📊 Charlotte Monroe Inventory (${inventory.length} items):`);
        console.log('=' .repeat(80));
        
        if (inventory.length === 0) {
            console.log('📭 No inventory items found for this location');
            return inventory;
        }
        
        // Sort by quantity (highest first)
        inventory.sort((a, b) => b.quantity - a.quantity);
        
        let totalValue = 0;
        inventory.forEach((item, index) => {
            const stockStatus = item.quantity > 0 ? '✅ In Stock' : '❌ Out of Stock';
            console.log(`${index + 1}. ${item.product_name}`);
            console.log(`   SKU: ${item.product_sku || 'N/A'}`);
            console.log(`   Quantity: ${item.quantity}`);
            console.log(`   Status: ${stockStatus}`);
            console.log(`   Product ID: ${item.product_id}`);
            console.log(`   Inventory ID: ${item.inventory_id}`);
            console.log('   ' + '-'.repeat(50));
        });
        
        // Summary statistics
        const inStockItems = inventory.filter(item => item.quantity > 0);
        const outOfStockItems = inventory.filter(item => item.quantity === 0);
        const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
        
        console.log('\n📈 INVENTORY SUMMARY:');
        console.log(`Total Items: ${inventory.length}`);
        console.log(`In Stock: ${inStockItems.length}`);
        console.log(`Out of Stock: ${outOfStockItems.length}`);
        console.log(`Total Quantity: ${totalQuantity}`);
        
        return inventory;
    } catch (error) {
        console.error('❌ Failed to fetch Charlotte inventory:', error.message);
        throw error;
    }
}

/**
 * Get low stock items across all locations
 */
async function getLowStockItems(threshold = 10) {
    console.log(`\n⚠️  Fetching low stock items (threshold: ${threshold})...`);
    try {
        const lowStockItems = await makeAPIRequest(`/wp-json/wc/v3/addify_headless_inventory/stock/low-stock?threshold=${threshold}`);
        
        if (lowStockItems.length === 0) {
            console.log('✅ No low stock items found');
            return;
        }
        
        console.log(`📉 Low Stock Items (${lowStockItems.length} items):`);
        lowStockItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.product_name} at ${item.location_name}`);
            console.log(`   SKU: ${item.product_sku || 'N/A'}`);
            console.log(`   Quantity: ${item.quantity}`);
            console.log(`   Location ID: ${item.location_id}`);
        });
        
        return lowStockItems;
    } catch (error) {
        console.error('❌ Failed to fetch low stock items:', error.message);
    }
}

/**
 * Test bulk inventory fetch for specific products using individual requests (WORKAROUND)
 */
async function testBulkInventory(productIds, locationId) {
    console.log(`\n🔄 Testing bulk inventory fetch for products: ${productIds.join(', ')}...`);
    console.log('⚠️  Using individual requests workaround (bulk endpoint has route registration issue)');
    
    try {
        const bulkData = {};
        
        // Fetch inventory for each product individually
        for (const productId of productIds) {
            try {
                const inventory = await makeAPIRequest(`/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`);
                
                // Filter by location if specified
                const locationInventory = locationId 
                    ? inventory.filter(inv => inv.location_id == locationId)
                    : inventory;
                
                if (locationInventory.length > 0) {
                    bulkData[productId] = locationInventory;
                }
            } catch (error) {
                console.error(`⚠️  Failed to fetch inventory for product ${productId}:`, error.message);
            }
        }
        
        console.log('📦 Bulk Inventory Results (via individual requests):');
        Object.entries(bulkData).forEach(([productId, inventories]) => {
            console.log(`Product ${productId}:`);
            inventories.forEach(inv => {
                console.log(`  - ${inv.location_name}: ${inv.quantity} units`);
            });
        });
        
        return bulkData;
    } catch (error) {
        console.error('❌ Failed to fetch bulk inventory:', error.message);
        return {};
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Flora Distro - Charlotte Monroe Inventory Test');
    console.log('=' .repeat(60));
    console.log(`API Base: ${API_BASE}`);
    console.log(`Consumer Key: ${CONSUMER_KEY.substring(0, 10)}...`);
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Get all locations and find Charlotte Monroe
        const locationId = await getAllLocations();
        
        // Step 2: Get Charlotte Monroe inventory
        const inventory = await getCharlotteInventory(locationId);
        
        // Step 3: Check for low stock items
        await getLowStockItems(5);
        
        // Step 4: If we have inventory, test bulk fetch with first few product IDs
        if (inventory && inventory.length > 0) {
            const sampleProductIds = inventory.slice(0, 3).map(item => item.product_id);
            await testBulkInventory(sampleProductIds, locationId);
        }
        
        console.log('\n✅ Charlotte Monroe inventory test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        makeAPIRequest,
        getAllLocations,
        getCharlotteInventory,
        getLowStockItems,
        testBulkInventory,
        CHARLOTTE_MONROE_LOCATION_ID,
        API_BASE
    };
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}