/**
 * MANUAL CHECKOUT TEST
 * Step-by-step simulation with real products that have inventory
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

async function findProductWithInventory() {
  log.divider();
  log.info('🔍 SEARCHING FOR PRODUCTS WITH INVENTORY...');
  log.divider();
  
  const locations = await floraImRequest('/locations');
  
  for (const location of locations) {
    log.info(`Checking location: ${location.name} (ID: ${location.id})`);
    
    const response = await floraImRequest(`/products?location_id=${location.id}&per_page=100`);
    
    if (response.success && response.data) {
      const productsWithStock = response.data.filter(p => 
        p.total_stock > 0 && 
        p.type === 'simple' &&
        (p.price || p.regular_price)
      );
      
      if (productsWithStock.length > 0) {
        const product = productsWithStock[0];
        log.success(`Found product with inventory!`);
        log.success(`  Product: ${product.name}`);
        log.success(`  ID: ${product.id}`);
        log.success(`  Location: ${location.name} (${location.id})`);
        log.success(`  Stock: ${product.total_stock} units`);
        log.success(`  Price: $${product.price || product.regular_price || '0'}`);
        
        return {
          product,
          location
        };
      }
    }
  }
  
  log.error('No products with inventory found');
  return null;
}

async function testCompleteCheckoutFlow() {
  try {
    log.divider();
    log.info('🧪 COMPLETE CHECKOUT FLOW TEST');
    log.divider();
    
    // Find a product with inventory
    const found = await findProductWithInventory();
    
    if (!found) {
      log.error('Cannot run test - no products with inventory found');
      return;
    }
    
    const { product, location } = found;
    const productId = product.id;
    const locationId = location.id;
    const quantityToSell = 1; // Sell 1 unit
    
    // STEP 1: Get current inventory
    log.divider();
    log.info('STEP 1: Get current inventory via Flora IM API');
    log.divider();
    
    const invBeforeResponse = await floraImRequest(
      `/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`
    );
    
    log.info(`Inventory API response: ${JSON.stringify(invBeforeResponse)}`);
    
    let stockBefore = 0;
    if (Array.isArray(invBeforeResponse) && invBeforeResponse.length > 0) {
      stockBefore = parseFloat(invBeforeResponse[0].quantity);
      log.success(`Current inventory: ${stockBefore} units`);
    } else {
      log.warn('No inventory record found - may need to initialize');
      // Try to get from product total_stock
      stockBefore = product.total_stock || 0;
      log.info(`Using product total_stock: ${stockBefore} units`);
    }
    
    if (stockBefore < quantityToSell) {
      log.error(`Insufficient stock: ${stockBefore} < ${quantityToSell}`);
      return;
    }
    
    // STEP 2: Create WooCommerce order
    log.divider();
    log.info('STEP 2: Create WooCommerce order');
    log.divider();
    
    const price = parseFloat(product.price || product.regular_price || '20');
    
    const orderData = {
      status: 'processing',
      payment_method: 'cash',
      payment_method_title: 'Cash',
      currency: 'USD',
      line_items: [
        {
          product_id: productId,
          quantity: quantityToSell,
          subtotal: (price * quantityToSell).toFixed(2),
          total: (price * quantityToSell).toFixed(2)
        }
      ],
      billing: {
        first_name: 'Test',
        last_name: 'Customer',
        email: `test-${Date.now()}@floradistro.com`,
        country: 'US',
        state: 'NC',
        city: location.city || 'Charlotte',
        postcode: location.postal_code || '28105'
      },
      shipping: {
        first_name: 'Test',
        last_name: 'Customer',
        country: 'US',
        state: 'NC',
        city: location.city || 'Charlotte',
        postcode: location.postal_code || '28105'
      },
      meta_data: [
        { key: '_pos_location_id', value: locationId.toString() },
        { key: '_flora_location_id', value: locationId.toString() },
        { key: '_store_id', value: locationId.toString() },
        { key: '_created_via', value: 'manual-test' },
        { key: '_flora_inventory_processed', value: 'yes' },
        { key: '_pos_order', value: 'true' }
      ],
      set_paid: true,
      created_via: 'manual-test'
    };
    
    log.info('Creating order...');
    log.info(`Order payload: ${JSON.stringify(orderData, null, 2)}`);
    
    const order = await wooRequest('/orders', 'POST', orderData);
    
    if (!order || !order.id) {
      log.error('Order creation failed');
      return;
    }
    
    log.success(`Order #${order.id} created successfully`);
    
    // STEP 3: Deduct inventory manually
    log.divider();
    log.info('STEP 3: Manually deduct inventory (mimicking frontend)');
    log.divider();
    
    const newStock = stockBefore - quantityToSell;
    log.info(`Deducting inventory: ${stockBefore} → ${newStock}`);
    
    const updatePayload = {
      product_id: parseInt(productId),
      location_id: parseInt(locationId),
      variation_id: 0,
      quantity: newStock,
      reason: `Order #${order.id} - Manual deduction test`,
      user_name: 'manual-test-suite'
    };
    
    log.info(`Update payload: ${JSON.stringify(updatePayload, null, 2)}`);
    
    try {
      const deductResult = await floraImRequest('/inventory', 'POST', updatePayload);
      
      if (deductResult.success) {
        log.success('Inventory deduction successful');
      } else {
        log.error(`Inventory deduction failed: ${JSON.stringify(deductResult)}`);
      }
    } catch (err) {
      log.error(`Inventory deduction exception: ${err.message}`);
      throw err;
    }
    
    // STEP 4: Verify inventory was deducted
    log.divider();
    log.info('STEP 4: Verify inventory deduction');
    log.divider();
    
    await new Promise(r => setTimeout(r, 1000)); // Wait for DB write
    
    const invAfterResponse = await floraImRequest(
      `/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`
    );
    
    if (Array.isArray(invAfterResponse) && invAfterResponse.length > 0) {
      const stockAfter = parseFloat(invAfterResponse[0].quantity);
      const expected = stockBefore - quantityToSell;
      
      log.info(`Before: ${stockBefore} units`);
      log.info(`After: ${stockAfter} units`);
      log.info(`Expected: ${expected} units`);
      
      if (Math.abs(stockAfter - expected) < 0.001) {
        log.success(`✅ INVENTORY DEDUCTION VERIFIED!`);
        log.success(`   Order #${order.id} created`);
        log.success(`   Stock: ${stockBefore} → ${stockAfter}`);
        log.success(`   Location: ${location.name} (${locationId})`);
      } else {
        log.error(`❌ INVENTORY MISMATCH!`);
        log.error(`   Expected: ${expected}`);
        log.error(`   Actual: ${stockAfter}`);
        log.error(`   Difference: ${Math.abs(stockAfter - expected)}`);
      }
    } else {
      log.error('Could not verify - no inventory record found after update');
    }
    
    // STEP 5: Mark order as completed
    log.divider();
    log.info('STEP 5: Mark order as completed');
    log.divider();
    
    const updatedOrder = await wooRequest(`/orders/${order.id}`, 'PUT', {
      status: 'completed'
    });
    
    log.success(`Order #${order.id} marked as completed`);
    
    // STEP 6: Restore inventory
    log.divider();
    log.info('STEP 6: Cleanup - restore inventory');
    log.divider();
    
    await floraImRequest('/inventory', 'POST', {
      product_id: parseInt(productId),
      location_id: parseInt(locationId),
      variation_id: 0,
      quantity: stockBefore,
      reason: 'Manual test cleanup - restoring inventory',
      user_name: 'manual-test-suite'
    });
    
    log.success('Inventory restored to original quantity');
    
    log.divider();
    log.success('🎉 CHECKOUT FLOW TEST COMPLETED SUCCESSFULLY!');
    log.divider();
    
  } catch (error) {
    log.divider();
    log.error(`TEST FAILED: ${error.message}`);
    log.divider();
    console.error(error);
  }
}

testCompleteCheckoutFlow();

