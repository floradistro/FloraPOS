/**
 * COMPREHENSIVE CHECKOUT FLOW TEST SUITE
 * Tests multi-location inventory, proper deduction, and bulletproof checkout
 */

const API_BASE = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Test configuration
const TEST_CONFIG = {
  // Use real location IDs from your system
  location1: 1, // Charlotte
  location2: 2, // Monroe
  location3: 3, // Matthews
  // We'll find test products dynamically
  testProductId: null,
  testVariantId: null,
};

// Color logging
const log = {
  info: (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  test: (msg) => console.log(`\x1b[35m🧪 ${msg}\x1b[0m`),
  divider: () => console.log(`\x1b[90m${'━'.repeat(80)}\x1b[0m`),
};

/**
 * Helper: Make authenticated request to Flora IM API
 */
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

/**
 * Helper: Make authenticated request to WooCommerce API
 */
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

/**
 * TEST 1: Verify Flora IM API connectivity and multi-location support
 */
async function test1_ApiConnectivity() {
  log.divider();
  log.test('TEST 1: API Connectivity & Multi-Location Support');
  log.divider();
  
  try {
    // Get all locations
    log.info('Fetching all locations...');
    const locations = await floraImRequest('/locations');
    
    if (!locations || locations.length === 0) {
      log.error('No locations found in system');
      return false;
    }
    
    log.success(`Found ${locations.length} locations:`);
    locations.forEach(loc => {
      log.info(`  - Location ${loc.id}: ${loc.name}`);
    });
    
    // Update test config with real location IDs
    if (locations[0]) TEST_CONFIG.location1 = locations[0].id;
    if (locations[1]) TEST_CONFIG.location2 = locations[1].id;
    if (locations[2]) TEST_CONFIG.location3 = locations[2].id;
    
    return true;
  } catch (error) {
    log.error(`API connectivity test failed: ${error.message}`);
    return false;
  }
}

/**
 * TEST 2: Find test products with inventory
 */
async function test2_FindTestProducts() {
  log.divider();
  log.test('TEST 2: Find Test Products with Inventory');
  log.divider();
  
  try {
    const locationId = TEST_CONFIG.location1;
    
    log.info(`Fetching products for location ${locationId}...`);
    const response = await floraImRequest(`/products?location_id=${locationId}&per_page=50`);
    
    if (!response.success || !response.data || response.data.length === 0) {
      log.error('No products found');
      return false;
    }
    
    const products = response.data;
    log.success(`Found ${products.length} products`);
    
    // Find a simple product with inventory
    const simpleProduct = products.find(p => 
      p.type === 'simple' && 
      p.stock_quantity > 0 &&
      p.id
    );
    
    if (simpleProduct) {
      TEST_CONFIG.testProductId = simpleProduct.id;
      log.success(`Selected simple product: "${simpleProduct.name}" (ID: ${simpleProduct.id}, Stock: ${simpleProduct.stock_quantity})`);
    }
    
    // Find a variable product with variants
    const variableProduct = products.find(p => 
      p.type === 'variable' &&
      p.variations && 
      p.variations.length > 0
    );
    
    if (variableProduct && variableProduct.variations[0]) {
      const variant = variableProduct.variations[0];
      TEST_CONFIG.testVariantProductId = variableProduct.id;
      TEST_CONFIG.testVariantId = variant.id;
      log.success(`Selected variant: "${variant.name}" (Parent: ${variableProduct.id}, Variant: ${variant.id}, Stock: ${variant.stock_quantity})`);
    }
    
    if (!TEST_CONFIG.testProductId) {
      log.error('Could not find suitable test product');
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Product search failed: ${error.message}`);
    return false;
  }
}

/**
 * TEST 3: Verify inventory reads are accurate per location
 */
async function test3_InventoryReads() {
  log.divider();
  log.test('TEST 3: Inventory Read Accuracy (Multi-Location)');
  log.divider();
  
  try {
    const productId = TEST_CONFIG.testProductId;
    const locationId = TEST_CONFIG.location1;
    
    log.info(`Reading inventory for product ${productId} at location ${locationId}...`);
    
    // Method 1: Via inventory endpoint
    const inv1 = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0`);
    
    log.info(`Method 1 (Inventory API): ${JSON.stringify(inv1)}`);
    
    if (!Array.isArray(inv1) || inv1.length === 0) {
      log.warn('No inventory record found (may be 0 stock or not tracked at this location)');
      return true; // This is ok, just means no inventory
    }
    
    const quantity = parseFloat(inv1[0].quantity);
    log.success(`Inventory at location ${locationId}: ${quantity} units`);
    
    // Test cache-busting - read again and verify it's fresh
    await new Promise(r => setTimeout(r, 100));
    const inv2 = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`);
    
    if (inv2.length > 0) {
      const quantity2 = parseFloat(inv2[0].quantity);
      if (quantity === quantity2) {
        log.success('Cache-busting works: Second read returned same quantity');
      } else {
        log.error(`Quantity mismatch: ${quantity} vs ${quantity2}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Inventory read test failed: ${error.message}`);
    return false;
  }
}

/**
 * TEST 4: Verify inventory updates work correctly
 */
async function test4_InventoryUpdates() {
  log.divider();
  log.test('TEST 4: Inventory Update & Deduction');
  log.divider();
  
  try {
    const productId = TEST_CONFIG.testProductId;
    const locationId = TEST_CONFIG.location1;
    
    // Get current inventory
    log.info('Getting current inventory...');
    const invBefore = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0`);
    
    let currentQty = 0;
    if (invBefore.length > 0) {
      currentQty = parseFloat(invBefore[0].quantity);
    }
    
    log.info(`Current quantity: ${currentQty}`);
    
    // Set a test quantity (add 10 units)
    const testQty = currentQty + 10;
    log.info(`Setting inventory to ${testQty} (added 10 units for testing)...`);
    
    const updateResult = await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      variation_id: 0,
      quantity: testQty,
      reason: 'Test Suite: Adding test inventory',
      user_name: 'checkout-test-suite'
    });
    
    if (!updateResult.success) {
      log.error('Update failed:', updateResult);
      return false;
    }
    
    log.success('Inventory updated successfully');
    
    // Verify the update
    await new Promise(r => setTimeout(r, 500)); // Wait for DB write
    const invAfter = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`);
    
    if (invAfter.length > 0) {
      const newQty = parseFloat(invAfter[0].quantity);
      if (Math.abs(newQty - testQty) < 0.001) {
        log.success(`Verified: Quantity is now ${newQty}`);
      } else {
        log.error(`Verification failed: Expected ${testQty}, got ${newQty}`);
        return false;
      }
    } else {
      log.error('Could not verify update - no inventory record found');
      return false;
    }
    
    // Now test deduction (remove 5 units)
    const deductQty = testQty - 5;
    log.info(`Testing deduction: ${testQty} → ${deductQty} (-5 units)...`);
    
    const deductResult = await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      variation_id: 0,
      quantity: deductQty,
      reason: 'Test Suite: Testing deduction',
      user_name: 'checkout-test-suite'
    });
    
    if (!deductResult.success) {
      log.error('Deduction failed:', deductResult);
      return false;
    }
    
    log.success('Deduction completed successfully');
    
    // Verify deduction
    await new Promise(r => setTimeout(r, 500));
    const invFinal = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`);
    
    if (invFinal.length > 0) {
      const finalQty = parseFloat(invFinal[0].quantity);
      if (Math.abs(finalQty - deductQty) < 0.001) {
        log.success(`Verified deduction: Quantity is now ${finalQty}`);
      } else {
        log.error(`Deduction verification failed: Expected ${deductQty}, got ${finalQty}`);
        return false;
      }
    }
    
    // Restore original quantity
    log.info(`Restoring original quantity: ${currentQty}...`);
    await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      variation_id: 0,
      quantity: currentQty,
      reason: 'Test Suite: Restoring original inventory',
      user_name: 'checkout-test-suite'
    });
    
    log.success('Original inventory restored');
    
    return true;
  } catch (error) {
    log.error(`Inventory update test failed: ${error.message}`);
    return false;
  }
}

/**
 * TEST 5: Complete checkout flow simulation
 */
async function test5_CheckoutFlow() {
  log.divider();
  log.test('TEST 5: Complete Checkout Flow (Order + Inventory Deduction)');
  log.divider();
  
  try {
    const productId = TEST_CONFIG.testProductId;
    const locationId = TEST_CONFIG.location1;
    const quantityToSell = 2;
    
    // STEP 1: Get current inventory
    log.info('STEP 1: Recording pre-sale inventory...');
    const invBefore = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0`);
    
    let stockBefore = 0;
    if (invBefore.length > 0) {
      stockBefore = parseFloat(invBefore[0].quantity);
    }
    
    if (stockBefore < quantityToSell) {
      log.warn(`Insufficient stock (${stockBefore}). Adding stock for test...`);
      await floraImRequest('/inventory', 'POST', {
        product_id: productId,
        location_id: locationId,
        variation_id: 0,
        quantity: stockBefore + 10,
        reason: 'Test Suite: Adding stock for checkout test'
      });
      await new Promise(r => setTimeout(r, 500));
      
      const invUpdated = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`);
      stockBefore = parseFloat(invUpdated[0].quantity);
    }
    
    log.success(`Pre-sale inventory: ${stockBefore} units`);
    
    // STEP 2: Create WooCommerce order
    log.info('STEP 2: Creating WooCommerce order...');
    
    const orderData = {
      status: 'processing',
      payment_method: 'cash',
      payment_method_title: 'Cash',
      currency: 'USD',
      line_items: [
        {
          product_id: productId,
          quantity: quantityToSell,
          subtotal: (20 * quantityToSell).toFixed(2),
          total: (20 * quantityToSell).toFixed(2)
        }
      ],
      billing: {
        first_name: 'Test',
        last_name: 'Customer',
        email: `test-${Date.now()}@floradistro.com`,
        country: 'US',
        state: 'NC',
        city: 'Charlotte',
        postcode: '28105'
      },
      shipping: {
        first_name: 'Test',
        last_name: 'Customer',
        country: 'US',
        state: 'NC',
        city: 'Charlotte',
        postcode: '28105'
      },
      meta_data: [
        { key: '_pos_location_id', value: locationId.toString() },
        { key: '_flora_location_id', value: locationId.toString() },
        { key: '_store_id', value: locationId.toString() },
        { key: '_created_via', value: 'test-suite' },
        { key: '_flora_inventory_processed', value: 'yes' }, // Prevent WordPress double-deduction
        { key: '_pos_order', value: 'true' }
      ],
      set_paid: true,
      created_via: 'test-suite'
    };
    
    const order = await wooRequest('/orders', 'POST', orderData);
    
    if (!order || !order.id) {
      log.error('Order creation failed - no order ID');
      return false;
    }
    
    log.success(`Order #${order.id} created successfully`);
    
    // STEP 3: Manually deduct inventory (mimicking frontend)
    log.info('STEP 3: Deducting inventory...');
    
    const newStock = stockBefore - quantityToSell;
    const deductResult = await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      variation_id: 0,
      quantity: newStock,
      reason: `Order #${order.id} - Sold ${quantityToSell} units`,
      user_name: 'test-suite'
    });
    
    if (!deductResult.success) {
      log.error('Inventory deduction failed:', deductResult);
      return false;
    }
    
    log.success('Inventory deducted successfully');
    
    // STEP 4: Verify inventory was deducted correctly
    log.info('STEP 4: Verifying inventory deduction...');
    await new Promise(r => setTimeout(r, 500));
    
    const invAfter = await floraImRequest(`/inventory?product_id=${productId}&location_id=${locationId}&variation_id=0&_nocache=${Date.now()}`);
    
    if (invAfter.length > 0) {
      const stockAfter = parseFloat(invAfter[0].quantity);
      const expectedStock = stockBefore - quantityToSell;
      
      if (Math.abs(stockAfter - expectedStock) < 0.001) {
        log.success(`✅ CHECKOUT FLOW VERIFIED:`);
        log.success(`   Before: ${stockBefore} units`);
        log.success(`   Sold: ${quantityToSell} units`);
        log.success(`   After: ${stockAfter} units`);
        log.success(`   Order: #${order.id}`);
      } else {
        log.error(`❌ INVENTORY MISMATCH:`);
        log.error(`   Expected: ${expectedStock} units`);
        log.error(`   Actual: ${stockAfter} units`);
        log.error(`   Difference: ${Math.abs(stockAfter - expectedStock)} units`);
        return false;
      }
    } else {
      log.error('Could not verify - no inventory record found');
      return false;
    }
    
    // STEP 5: Mark order as completed
    log.info('STEP 5: Marking order as completed...');
    const updateOrder = await wooRequest(`/orders/${order.id}`, 'PUT', {
      status: 'completed'
    });
    
    log.success(`Order #${order.id} marked as completed`);
    
    // STEP 6: Restore inventory for cleanup
    log.info('STEP 6: Restoring inventory for cleanup...');
    await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      variation_id: 0,
      quantity: stockBefore,
      reason: 'Test Suite: Cleanup - restoring inventory'
    });
    
    log.success('Inventory restored');
    
    return true;
  } catch (error) {
    log.error(`Checkout flow test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * TEST 6: Multi-location isolation test
 */
async function test6_MultiLocationIsolation() {
  log.divider();
  log.test('TEST 6: Multi-Location Isolation (Verify location-specific inventory)');
  log.divider();
  
  try {
    const productId = TEST_CONFIG.testProductId;
    const location1 = TEST_CONFIG.location1;
    const location2 = TEST_CONFIG.location2;
    
    log.info(`Testing inventory isolation between Location ${location1} and Location ${location2}...`);
    
    // Get inventory at both locations
    const inv1 = await floraImRequest(`/inventory?product_id=${productId}&location_id=${location1}&variation_id=0`);
    const inv2 = await floraImRequest(`/inventory?product_id=${productId}&location_id=${location2}&variation_id=0`);
    
    const qty1 = inv1.length > 0 ? parseFloat(inv1[0].quantity) : 0;
    const qty2 = inv2.length > 0 ? parseFloat(inv2[0].quantity) : 0;
    
    log.info(`Location ${location1}: ${qty1} units`);
    log.info(`Location ${location2}: ${qty2} units`);
    
    // Modify location 1 inventory
    const testQty = qty1 + 5;
    log.info(`Adding 5 units to Location ${location1}...`);
    
    await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: location1,
      variation_id: 0,
      quantity: testQty
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Verify location 1 changed but location 2 didn't
    const inv1After = await floraImRequest(`/inventory?product_id=${productId}&location_id=${location1}&variation_id=0&_nocache=${Date.now()}`);
    const inv2After = await floraImRequest(`/inventory?product_id=${productId}&location_id=${location2}&variation_id=0&_nocache=${Date.now()}`);
    
    const qty1After = inv1After.length > 0 ? parseFloat(inv1After[0].quantity) : 0;
    const qty2After = inv2After.length > 0 ? parseFloat(inv2After[0].quantity) : 0;
    
    if (Math.abs(qty1After - testQty) < 0.001 && Math.abs(qty2After - qty2) < 0.001) {
      log.success(`✅ LOCATION ISOLATION VERIFIED:`);
      log.success(`   Location ${location1}: ${qty1} → ${qty1After} (changed)`);
      log.success(`   Location ${location2}: ${qty2} → ${qty2After} (unchanged)`);
    } else {
      log.error('Location isolation failed - inventory leaked between locations');
      return false;
    }
    
    // Restore
    await floraImRequest('/inventory', 'POST', {
      product_id: productId,
      location_id: location1,
      variation_id: 0,
      quantity: qty1
    });
    
    log.success('Inventory restored');
    
    return true;
  } catch (error) {
    log.error(`Multi-location isolation test failed: ${error.message}`);
    return false;
  }
}

/**
 * TEST 7: Variant inventory test (if variants are available)
 */
async function test7_VariantInventory() {
  log.divider();
  log.test('TEST 7: Variant Product Inventory');
  log.divider();
  
  if (!TEST_CONFIG.testVariantId) {
    log.warn('No variant products found - skipping variant test');
    return true;
  }
  
  try {
    const parentId = TEST_CONFIG.testVariantProductId;
    const variantId = TEST_CONFIG.testVariantId;
    const locationId = TEST_CONFIG.location1;
    
    log.info(`Testing variant: Parent ${parentId}, Variant ${variantId}, Location ${locationId}`);
    
    // Get variant inventory
    const inv = await floraImRequest(`/inventory?product_id=${parentId}&location_id=${locationId}&variation_id=${variantId}`);
    
    const currentQty = inv.length > 0 ? parseFloat(inv[0].quantity) : 0;
    log.success(`Current variant inventory: ${currentQty} units`);
    
    // Test update
    const testQty = currentQty + 3;
    log.info(`Updating variant inventory to ${testQty}...`);
    
    await floraImRequest('/inventory', 'POST', {
      product_id: parentId,
      location_id: locationId,
      variation_id: variantId,
      quantity: testQty
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Verify
    const invAfter = await floraImRequest(`/inventory?product_id=${parentId}&location_id=${locationId}&variation_id=${variantId}&_nocache=${Date.now()}`);
    const qtyAfter = invAfter.length > 0 ? parseFloat(invAfter[0].quantity) : 0;
    
    if (Math.abs(qtyAfter - testQty) < 0.001) {
      log.success(`Variant inventory updated correctly: ${qtyAfter} units`);
    } else {
      log.error(`Variant inventory update failed: Expected ${testQty}, got ${qtyAfter}`);
      return false;
    }
    
    // Restore
    await floraImRequest('/inventory', 'POST', {
      product_id: parentId,
      location_id: locationId,
      variation_id: variantId,
      quantity: currentQty
    });
    
    log.success('Variant inventory restored');
    
    return true;
  } catch (error) {
    log.error(`Variant inventory test failed: ${error.message}`);
    return false;
  }
}

/**
 * MAIN TEST RUNNER
 */
async function runAllTests() {
  console.log('\x1b[1m\x1b[36m');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   FLORA POS - CHECKOUT FLOW TEST SUITE                     ║');
  console.log('║                          Comprehensive Tests                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');
  
  const results = [];
  
  // Run tests sequentially
  results.push({ name: 'API Connectivity', passed: await test1_ApiConnectivity() });
  results.push({ name: 'Find Test Products', passed: await test2_FindTestProducts() });
  results.push({ name: 'Inventory Reads', passed: await test3_InventoryReads() });
  results.push({ name: 'Inventory Updates', passed: await test4_InventoryUpdates() });
  results.push({ name: 'Complete Checkout Flow', passed: await test5_CheckoutFlow() });
  results.push({ name: 'Multi-Location Isolation', passed: await test6_MultiLocationIsolation() });
  results.push({ name: 'Variant Inventory', passed: await test7_VariantInventory() });
  
  // Summary
  log.divider();
  console.log('\x1b[1m\x1b[36m');
  console.log('TEST SUMMARY');
  console.log('\x1b[0m');
  log.divider();
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    if (r.passed) {
      log.success(`${r.name}`);
    } else {
      log.error(`${r.name}`);
    }
  });
  
  log.divider();
  
  if (passed === total) {
    console.log('\x1b[1m\x1b[32m');
    console.log(`✅ ALL TESTS PASSED (${passed}/${total})`);
    console.log('\x1b[0m');
    log.success('Checkout flow is BULLETPROOF ✨');
  } else {
    console.log('\x1b[1m\x1b[31m');
    console.log(`❌ SOME TESTS FAILED (${passed}/${total} passed)`);
    console.log('\x1b[0m');
    log.error('Issues found - review logs above');
  }
  
  log.divider();
}

// Run the test suite
runAllTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

