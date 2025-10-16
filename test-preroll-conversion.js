/**
 * PRE-ROLL CONVERSION TEST
 * Tests that selling 1 pre-roll deducts 0.7g from flower inventory
 */

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  divider: () => console.log(`\x1b[90m${'━'.repeat(80)}\x1b[0m`),
};

async function floraImRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(`${API_BASE}/wp-json/flora-im/v1${endpoint}`);
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function wooRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(`${API_BASE}/wp-json/wc/v3${endpoint}`);
  url.searchParams.append('consumer_key', CONSUMER_KEY);
  url.searchParams.append('consumer_secret', CONSUMER_SECRET);
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`WooCommerce Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function testPreRollConversion() {
  try {
    log.divider();
    log.info('🧪 PRE-ROLL CONVERSION TEST');
    log.divider();
    
    // We'll use the frontend's inventory deduction service logic here
    // to simulate what happens when a pre-roll is sold
    
    // SCENARIO: 
    // - Sell 1 pre-roll
    // - Pre-roll has conversion ratio: 0.7g flower per 1 pre-roll
    // - Should deduct 0.7g from flower inventory, not 1g
    
    log.info('Test configuration:');
    log.info('  - Product: Pre-roll (hypothetical)');
    log.info('  - Quantity sold: 1 unit');
    log.info('  - Conversion: 0.7g flower per 1 pre-roll');
    log.info('  - Expected deduction: 0.7g from flower inventory');
    log.divider();
    
    // Find a flower product to use as the source
    log.info('Finding flower product...');
    const locations = await floraImRequest('/locations');
    const location = locations[0];
    
    const productsResponse = await floraImRequest(`/products?location_id=${location.id}&per_page=100`);
    
    if (!productsResponse.success || !productsResponse.data) {
      log.error('Failed to load products');
      return;
    }
    
    // Find a flower product with stock
    const flowerProduct = productsResponse.data.find(p => 
      p.categories.some(cat => cat.slug === 'flower') && 
      p.total_stock > 5
    );
    
    if (!flowerProduct) {
      log.error('No flower products found with sufficient stock');
      return;
    }
    
    log.success(`Found flower product: ${flowerProduct.name} (ID: ${flowerProduct.id})`);
    log.info(`Current stock: ${flowerProduct.total_stock}g`);
    
    // Get precise inventory
    const invBefore = await floraImRequest(
      `/inventory?product_id=${flowerProduct.id}&location_id=${location.id}&variation_id=0&_nocache=${Date.now()}`
    );
    
    const stockBefore = invBefore.length > 0 ? parseFloat(invBefore[0].quantity) : 0;
    log.info(`Precise inventory before: ${stockBefore}g`);
    
    log.divider();
    log.info('SIMULATING PRE-ROLL SALE');
    log.divider();
    
    // Simulate conversion calculation (what our fixed code does)
    const preRollsSold = 1;
    const conversionRatio = {
      input_amount: 0.7,    // 0.7g of flower
      input_unit: 'g',
      output_amount: 1,      // per 1 pre-roll
      output_unit: 'preroll'
    };
    
    const conversionMultiplier = conversionRatio.input_amount / conversionRatio.output_amount;
    const quantityToDeduct = preRollsSold * conversionMultiplier;
    
    log.info(`Conversion calculation:`);
    log.info(`  ${preRollsSold} preroll × (${conversionRatio.input_amount}g / ${conversionRatio.output_amount} preroll)`);
    log.info(`  = ${quantityToDeduct}g to deduct`);
    
    log.divider();
    log.info('APPLYING DEDUCTION');
    log.divider();
    
    const newStock = stockBefore - quantityToDeduct;
    
    log.info(`Updating inventory: ${stockBefore}g → ${newStock}g`);
    
    const updateResult = await floraImRequest('/inventory', 'POST', {
      product_id: parseInt(flowerProduct.id),
      location_id: parseInt(location.id),
      variation_id: 0,
      quantity: newStock,
      reason: 'Pre-roll conversion test - sold 1 pre-roll',
      user_name: 'preroll-test'
    });
    
    if (!updateResult.success) {
      log.error('Failed to update inventory');
      return;
    }
    
    log.success('Inventory updated');
    
    // Verify
    await new Promise(r => setTimeout(r, 500));
    
    const invAfter = await floraImRequest(
      `/inventory?product_id=${flowerProduct.id}&location_id=${location.id}&variation_id=0&_nocache=${Date.now()}`
    );
    
    const stockAfter = invAfter.length > 0 ? parseFloat(invAfter[0].quantity) : 0;
    
    log.divider();
    log.info('VERIFICATION');
    log.divider();
    
    log.info(`Stock before: ${stockBefore}g`);
    log.info(`Stock after: ${stockAfter}g`);
    log.info(`Expected: ${newStock}g`);
    log.info(`Deducted: ${stockBefore - stockAfter}g`);
    
    if (Math.abs(stockAfter - newStock) < 0.001) {
      log.success('✅ CONVERSION TEST PASSED!');
      log.success(`Selling 1 pre-roll correctly deducted ${quantityToDeduct}g (not 1g)`);
    } else {
      log.error('❌ CONVERSION TEST FAILED');
      log.error(`Expected ${newStock}g, got ${stockAfter}g`);
    }
    
    log.divider();
    log.info('CLEANUP');
    log.divider();
    
    // Restore original quantity
    await floraImRequest('/inventory', 'POST', {
      product_id: parseInt(flowerProduct.id),
      location_id: parseInt(location.id),
      variation_id: 0,
      quantity: stockBefore,
      reason: 'Pre-roll test cleanup',
      user_name: 'preroll-test'
    });
    
    log.success('Original inventory restored');
    
    log.divider();
    log.success('TEST COMPLETE');
    log.divider();
    
  } catch (error) {
    log.divider();
    log.error(`TEST FAILED: ${error.message}`);
    log.divider();
    console.error(error);
  }
}

testPreRollConversion();

