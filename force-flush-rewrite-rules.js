/**
 * Force WordPress to flush rewrite rules by testing after plugin reactivation
 */

const API_BASE = 'http://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

async function testAfterReactivation() {
    console.log('🔄 Testing After Plugin Reactivation');
    console.log('Please deactivate and reactivate the Addify plugin in WordPress admin');
    console.log('Then press Enter to continue...');
    console.log('=' .repeat(60));
    
    // Wait for user confirmation
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
    
    console.log('\n🧪 Testing bulk endpoint after reactivation...');
    
    const endpoint = '/wp-json/wc/v3/addify_headless_inventory/bulk-inventory';
    const testData = {
        product_ids: [792, 756, 765],
        location_id: 30
    };
    
    try {
        const url = `${API_BASE}${endpoint}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FloraDistro-ReactivationTest/1.0'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🎉 SUCCESS! Bulk endpoint is working after reactivation!');
            
            if (typeof result === 'object' && result !== null) {
                const productCount = Object.keys(result).length;
                console.log(`📦 Products with inventory: ${productCount}`);
                
                Object.entries(result).forEach(([productId, inventory]) => {
                    console.log(`\n📋 Product ${productId}:`);
                    if (Array.isArray(inventory)) {
                        inventory.forEach(item => {
                            console.log(`   • ${item.quantity} units at ${item.location_name || `Location ${item.location_id}`}`);
                        });
                    }
                });
            }
            
            return true;
            
        } else {
            const errorText = await response.text();
            console.log('❌ Still not working after reactivation');
            console.log('📄 Error:', errorText.substring(0, 200));
            
            // Try to get more specific error info
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.code !== 'rest_no_route') {
                    console.log('💡 Different error code - progress!');
                    console.log(`   New error: ${errorJson.code} - ${errorJson.message}`);
                }
            } catch (e) {
                // Not JSON
            }
            
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 WordPress Rewrite Rules Flush Test');
    console.log('This will test if plugin reactivation fixes the routing issue');
    console.log('=' .repeat(65));
    
    const success = await testAfterReactivation();
    
    if (success) {
        console.log('\n🎉 Plugin reactivation fixed the issue!');
        console.log('✅ Bulk endpoints are now working properly');
    } else {
        console.log('\n❌ Plugin reactivation did not fix the issue');
        console.log('💡 This suggests a deeper WordPress or server configuration problem');
        console.log('   - Check WordPress error logs');
        console.log('   - Verify PHP error reporting is enabled');
        console.log('   - Check server rewrite rules');
    }
}

// Run the test
main().catch(console.error);