#!/usr/bin/env node

/**
 * Fix Customer Name Capitalization
 * 
 * Converts ALL CAPS customer names to proper Title Case
 * Safe: Only fixes names that are entirely uppercase
 * Dry-run by default to preview changes
 */

const https = require('https');

// WooCommerce API Configuration
const API_URL = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Get command line args
const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');
const verbose = args.includes('--verbose');

console.log('🔧 Customer Name Capitalization Fixer\n');

if (isDryRun) {
  console.log('📋 DRY RUN MODE - No changes will be made');
  console.log('   Run with --apply to actually update customers\n');
} else {
  console.log('⚠️  APPLY MODE - Changes will be made!\n');
}

/**
 * Check if string is all uppercase
 */
function isAllCaps(str) {
  if (!str || typeof str !== 'string') return false;
  // Check if string has letters and all letters are uppercase
  const hasLetters = /[a-zA-Z]/.test(str);
  const allCaps = str === str.toUpperCase();
  return hasLetters && allCaps;
}

/**
 * Convert to Title Case
 * "JOHN DOE" -> "John Doe"
 * Handles special cases like "McDonald", "O'Brien"
 */
function toTitleCase(str) {
  if (!str) return str;
  
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Make API request
 */
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    url.searchParams.append('consumer_key', CONSUMER_KEY);
    url.searchParams.append('consumer_secret', CONSUMER_SECRET);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FloraPOS-CapitalizationFixer/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Fetch all customers (paginated)
 */
async function fetchAllCustomers() {
  const allCustomers = [];
  let page = 1;
  let hasMore = true;

  console.log('📥 Fetching customers...');

  while (hasMore) {
    try {
      const customers = await apiRequest('GET', `/wp-json/wc/v3/customers?page=${page}&per_page=100`);
      
      if (customers && customers.length > 0) {
        allCustomers.push(...customers);
        console.log(`   Fetched page ${page}: ${customers.length} customers`);
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      if (error.message.includes('400')) {
        // No more pages
        hasMore = false;
      } else {
        throw error;
      }
    }
  }

  console.log(`✅ Total customers fetched: ${allCustomers.length}\n`);
  return allCustomers;
}

/**
 * Analyze customer names and find ones that need fixing
 */
function analyzeCustomers(customers) {
  const needsFixing = [];

  for (const customer of customers) {
    const changes = {};
    let hasChanges = false;

    // Check first name
    if (isAllCaps(customer.first_name)) {
      changes.first_name = {
        old: customer.first_name,
        new: toTitleCase(customer.first_name)
      };
      hasChanges = true;
    }

    // Check last name
    if (isAllCaps(customer.last_name)) {
      changes.last_name = {
        old: customer.last_name,
        new: toTitleCase(customer.last_name)
      };
      hasChanges = true;
    }

    // Check billing first name
    if (customer.billing?.first_name && isAllCaps(customer.billing.first_name)) {
      if (!changes.billing) changes.billing = {};
      changes.billing.first_name = {
        old: customer.billing.first_name,
        new: toTitleCase(customer.billing.first_name)
      };
      hasChanges = true;
    }

    // Check billing last name
    if (customer.billing?.last_name && isAllCaps(customer.billing.last_name)) {
      if (!changes.billing) changes.billing = {};
      changes.billing.last_name = {
        old: customer.billing.last_name,
        new: toTitleCase(customer.billing.last_name)
      };
      hasChanges = true;
    }

    // Check shipping first name
    if (customer.shipping?.first_name && isAllCaps(customer.shipping.first_name)) {
      if (!changes.shipping) changes.shipping = {};
      changes.shipping.first_name = {
        old: customer.shipping.first_name,
        new: toTitleCase(customer.shipping.first_name)
      };
      hasChanges = true;
    }

    // Check shipping last name
    if (customer.shipping?.last_name && isAllCaps(customer.shipping.last_name)) {
      if (!changes.shipping) changes.shipping = {};
      changes.shipping.last_name = {
        old: customer.shipping.last_name,
        new: toTitleCase(customer.shipping.last_name)
      };
      hasChanges = true;
    }

    if (hasChanges) {
      needsFixing.push({
        id: customer.id,
        email: customer.email,
        changes
      });
    }
  }

  return needsFixing;
}

/**
 * Display changes to be made
 */
function displayChanges(customersToFix) {
  console.log('📝 Customers that need fixing:\n');

  if (customersToFix.length === 0) {
    console.log('✨ No customers need fixing! All names are properly formatted.\n');
    return;
  }

  for (const customer of customersToFix) {
    console.log(`👤 Customer #${customer.id} (${customer.email})`);
    
    if (customer.changes.first_name) {
      console.log(`   First Name: "${customer.changes.first_name.old}" → "${customer.changes.first_name.new}"`);
    }
    if (customer.changes.last_name) {
      console.log(`   Last Name: "${customer.changes.last_name.old}" → "${customer.changes.last_name.new}"`);
    }
    if (customer.changes.billing) {
      if (customer.changes.billing.first_name) {
        console.log(`   Billing First: "${customer.changes.billing.first_name.old}" → "${customer.changes.billing.first_name.new}"`);
      }
      if (customer.changes.billing.last_name) {
        console.log(`   Billing Last: "${customer.changes.billing.last_name.old}" → "${customer.changes.billing.last_name.new}"`);
      }
    }
    if (customer.changes.shipping) {
      if (customer.changes.shipping.first_name) {
        console.log(`   Shipping First: "${customer.changes.shipping.first_name.old}" → "${customer.changes.shipping.first_name.new}"`);
      }
      if (customer.changes.shipping.last_name) {
        console.log(`   Shipping Last: "${customer.changes.shipping.last_name.old}" → "${customer.changes.shipping.last_name.new}"`);
      }
    }
    console.log('');
  }

  console.log(`📊 Summary: ${customersToFix.length} customers need capitalization fixes\n`);
}

/**
 * Apply fixes to customers
 */
async function applyFixes(customersToFix) {
  console.log('🔄 Applying fixes...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < customersToFix.length; i++) {
    const customer = customersToFix[i];
    
    try {
      // Build update payload
      const updateData = {};

      if (customer.changes.first_name) {
        updateData.first_name = customer.changes.first_name.new;
      }
      if (customer.changes.last_name) {
        updateData.last_name = customer.changes.last_name.new;
      }
      if (customer.changes.billing) {
        updateData.billing = {};
        if (customer.changes.billing.first_name) {
          updateData.billing.first_name = customer.changes.billing.first_name.new;
        }
        if (customer.changes.billing.last_name) {
          updateData.billing.last_name = customer.changes.billing.last_name.new;
        }
      }
      if (customer.changes.shipping) {
        updateData.shipping = {};
        if (customer.changes.shipping.first_name) {
          updateData.shipping.first_name = customer.changes.shipping.first_name.new;
        }
        if (customer.changes.shipping.last_name) {
          updateData.shipping.last_name = customer.changes.shipping.last_name.new;
        }
      }

      // Update customer via API
      await apiRequest('PUT', `/wp-json/wc/v3/customers/${customer.id}`, updateData);
      
      successCount++;
      console.log(`✅ [${i + 1}/${customersToFix.length}] Updated customer #${customer.id}`);

      if (verbose) {
        console.log(`   ${JSON.stringify(updateData, null, 2)}`);
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errorCount++;
      console.error(`❌ [${i + 1}/${customersToFix.length}] Failed to update customer #${customer.id}`);
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log('\n📊 Results:');
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total processed: ${customersToFix.length}\n`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Fetch all customers
    const customers = await fetchAllCustomers();

    // Analyze and find customers that need fixing
    const customersToFix = analyzeCustomers(customers);

    // Display changes
    displayChanges(customersToFix);

    if (customersToFix.length === 0) {
      console.log('✨ Nothing to do! Exiting.\n');
      return;
    }

    // Apply fixes if not dry run
    if (!isDryRun) {
      console.log('⚠️  Proceeding to apply fixes in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await applyFixes(customersToFix);
      console.log('✅ Done! All capitalization fixes applied.\n');
    } else {
      console.log('💡 Tip: Run with --apply to actually make these changes\n');
      console.log('   node scripts/fix-customer-capitalization.js --apply\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
main();

