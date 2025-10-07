import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials, type ApiEnvironment } from '@/lib/server-api-config';

const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const CACHE_DURATION = 60000; // 1 minute cache
const CACHE_VERSION = 'v14_no_duplicates'; // Increment this to bust all caches - REMOVED DUPLICATE RULES

// Environment-specific cache for blueprint data to avoid repeated API calls
let blueprintCache: {
  version?: string;
  production?: {
    assignments?: any[];
    rules?: any[];
    lastFetch?: number;
  };
  staging?: {
    assignments?: any[];
    rules?: any[];
    lastFetch?: number;
  };
  docker?: {
    assignments?: any[];
    rules?: any[];
    lastFetch?: number;
  };
} = { version: CACHE_VERSION };

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      console.error('❌ BATCH PRICING: No products array');
      return NextResponse.json({
        success: false,
        error: 'products array is required'
      }, { status: 400 });
    }

    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);

    console.log(`\n========================================`);
    console.log(`🔄 [${apiEnv.toUpperCase()}] BATCH PRICING for ${products.length} products`);
    console.log(`   Cache version: ${CACHE_VERSION}`);
    console.log(`========================================`);

    // Load all blueprint data once at the start
    await loadBlueprintData(apiEnv);

    const results: Record<number, any> = {};

    // Process all products using cached data
    for (const product of products) {
      const { id: productId, categoryIds = [] } = product;
      
      try {
        // Find blueprint assignment from cache
        const assignment = findBlueprintAssignmentFromCache(productId, categoryIds, apiEnv);
        
        if (!assignment) {
          console.log(`⚠️ [${apiEnv.toUpperCase()}] No assignment found for product ${productId} with categories [${categoryIds}]`);
          results[productId] = null;
          continue;
        }

        console.log(`✓ [${apiEnv.toUpperCase()}] Product ${productId} → Blueprint ${assignment.blueprint_id} (${assignment.blueprint_name})`);

        // Get pricing rules for the blueprint from cache
        const allPricingRules = findBlueprintRulesFromCache(assignment.blueprint_id, apiEnv);

        if (!allPricingRules || allPricingRules.length === 0) {
          console.log(`⚠️ [${apiEnv.toUpperCase()}] No pricing rules for blueprint ${assignment.blueprint_id}`);
          results[productId] = null;
          continue;
        }

        console.log(`✓ [${apiEnv.toUpperCase()}] Found ${allPricingRules.length} pricing rules for blueprint ${assignment.blueprint_id}`);

        // For moonwater blueprint (ID 5 local, ID 44 production), filter rules by product name to get specific pricing tier
        let relevantRules = allPricingRules;
        if (assignment.blueprint_id === 5 || assignment.blueprint_id === 44) {
          // Get the product name to match with rule name
          const productName = await getProductName(productId, apiEnv);
          if (productName) {
            // Filter rules to only include the one that matches this product
            const matchingRules = allPricingRules.filter((rule: any) => {
              const ruleName = rule.rule_name.toLowerCase();
              const prodName = productName.toLowerCase();
              
              // Match patterns like "Day Drinker" product with "Day drinker 5mg" rule
              return ruleName.includes(prodName) || prodName.includes(ruleName.split(' ')[0]);
            });
            
            if (matchingRules.length > 0) {
              relevantRules = matchingRules;
            }
          }
        }

        results[productId] = {
          productId,
          blueprintId: assignment.blueprint_id,
          blueprintName: assignment.blueprint_name,
          ruleGroups: convertRulesToGroupedTiers(relevantRules)
        };

      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        results[productId] = null;
      }
    }

    const successCount = Object.values(results).filter(r => r !== null).length;
    console.log(`✅ [${apiEnv.toUpperCase()}] Batch blueprint pricing completed: ${successCount}/${products.length} products have pricing tiers`);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        environment: apiEnv,
        totalProducts: products.length,
        withPricing: successCount
      }
    });

  } catch (error) {
    console.error('❌ Batch blueprint pricing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Batch blueprint pricing failed'
    }, { status: 500 });
  }
}

// Load all blueprint data once and cache it
async function loadBlueprintData(apiEnv: ApiEnvironment) {
  const now = Date.now();
  
  // Check cache version - clear if outdated
  if (blueprintCache.version !== CACHE_VERSION) {
    console.log(`🔄 Cache version mismatch (${blueprintCache.version} !== ${CACHE_VERSION}) - clearing all caches`);
    blueprintCache = { version: CACHE_VERSION };
  }
  
  // Initialize environment-specific cache if not exists
  if (!blueprintCache[apiEnv]) {
    blueprintCache[apiEnv] = {};
  }
  
  const envCache = blueprintCache[apiEnv]!;
  
  // Return cached data if still valid for this environment
  if (envCache.assignments && envCache.rules && 
      envCache.lastFetch && (now - envCache.lastFetch) < CACHE_DURATION) {
    console.log(`✅ [${apiEnv.toUpperCase()}] Using cached blueprint data (${envCache.assignments.length} assignments, ${envCache.rules.length} rules)`);
    return;
  }

  console.log(`🔄 [${apiEnv.toUpperCase()}] Loading fresh blueprint data...`);

  try {
    // Load assignments and rules in parallel
    const [assignments, rules] = await Promise.all([
      loadBlueprintAssignments(apiEnv),
      loadAllPricingRules(apiEnv)
    ]);

    blueprintCache[apiEnv] = {
      assignments,
      rules,
      lastFetch: now
    };

    console.log(`✅ [${apiEnv.toUpperCase()}] Cached ${assignments.length} assignments and ${rules.length} pricing rules`);
  } catch (error) {
    console.error(`❌ [${apiEnv.toUpperCase()}] Error loading blueprint data:`, error);
    // Use existing cache if available, otherwise empty arrays
    if (!envCache.assignments) {
      blueprintCache[apiEnv] = {
        ...envCache,
        assignments: [],
        rules: []
      };
    }
  }
}

// Load blueprint assignments from category fields (V2 API)
async function loadBlueprintAssignments(apiEnv: ApiEnvironment) {
  const baseUrl = getApiBaseUrl(apiEnv);
  const credentials = getApiCredentials();
  
  console.log(`\n🔍 [${apiEnv.toUpperCase()}] Building blueprint assignments from category fields...`);
  
  // Category IDs to check
  const categoryIds = [16, 17, 18, 19, 20]; // Concentrate, Edibles, Flower, Moonwater, Vape
  const allAssignments: any[] = [];
  
  for (const categoryId of categoryIds) {
    try {
      const url = `${baseUrl}/wp-json/fd/v2/categories/${categoryId}/fields?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}&_t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'POSV1/1.0'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const result = await response.json();
        const fields = result.fields || [];
        
        console.log(`   📊 Category ${categoryId} returned ${fields.length} fields`);
        if (fields.length > 0) {
          console.log(`      Sample fields:`, fields.slice(0, 3).map((f: any) => ({
            id: f.id,
            name: f.name,
            group: f.group || f.group_label
          })));
        }
        
        // Group fields by group_label (this is the "blueprint" in V2)
        const groupedByLabel: Record<string, any[]> = {};
        fields.forEach((field: any) => {
          const groupLabel = field.group || field.group_label || 'default';
          if (!groupedByLabel[groupLabel]) {
            groupedByLabel[groupLabel] = [];
          }
          groupedByLabel[groupLabel].push(field);
        });
        
        console.log(`   📁 Grouped into ${Object.keys(groupedByLabel).length} groups:`, Object.keys(groupedByLabel));
        
        // Create one assignment per group - BUT only for actual "blueprint" fields
        // Skip utility fields like "Product Info", "Lab Data", "default"
        const skipGroups = ['Product Info', 'Lab Data', 'default', 'null', ''];
        
        Object.entries(groupedByLabel).forEach(([groupLabel, groupFields]) => {
          // Skip utility/system fields
          if (skipGroups.includes(groupLabel)) {
            console.log(`      ⏭️  Skipping utility group: ${groupLabel}`);
            return;
          }
          
          // Use the first field's ID as the blueprint ID - ensure it's a number
          const blueprintId = parseInt(groupFields[0].id);
          
          console.log(`      → Creating assignment: ${groupLabel} (ID ${blueprintId}) for Category ${categoryId}`);
          
          allAssignments.push({
            id: blueprintId,
            blueprint_id: blueprintId,
            blueprint_name: groupLabel,
            category_id: categoryId,
            entity_type: 'category'
          });
        });
      } else {
        console.log(`   ❌ Category ${categoryId} API returned status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Failed to fetch fields for category ${categoryId}:`, error);
    }
  }
  
    console.log(`✅ [${apiEnv.toUpperCase()}] Built ${allAssignments.length} blueprint assignments from V2 field groups`);
  if (allAssignments.length > 0) {
    console.log(`   Sample:`, allAssignments.slice(0, 3).map((a: any) => `${a.blueprint_name} (ID ${a.blueprint_id}) → Cat ${a.category_id}`));
    console.log(`   All category 18 assignments:`, allAssignments.filter((a: any) => a.category_id === 18));
  }
  
  return allAssignments;
}

// Load all pricing rules once (V2 API - pricing rules table unchanged)
async function loadAllPricingRules(apiEnv: ApiEnvironment) {
  const baseUrl = getApiBaseUrl(apiEnv);
  const credentials = getApiCredentials();
  // Note: Pricing rules are still in the same table, just accessed via V2 endpoint
  const url = `${baseUrl}/wp-json/fd/v2/pricing/rules?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}&_t=${Date.now()}`;
  
  console.log(`🔍 [${apiEnv.toUpperCase()}] Fetching pricing rules from V2 API:`, url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'POSV1/1.0'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error(`❌ [${apiEnv.toUpperCase()}] Pricing rules API error:`, response.status, response.statusText);
    throw new Error(`Pricing rules API error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`📊 [${apiEnv.toUpperCase()}] Raw pricing rules response:`, {
    isArray: Array.isArray(result),
    hasRulesProperty: 'rules' in result,
    totalCount: Array.isArray(result) ? result.length : (result.rules?.length || 0),
    sampleKeys: Array.isArray(result) ? Object.keys(result[0] || {}) : Object.keys(result)
  });
  
  // Handle both array and object with rules property
  let allRules = Array.isArray(result) ? result : (result.rules || []);
  
  // Log sample rule for debugging
  if (allRules.length > 0) {
    console.log(`📋 [${apiEnv.toUpperCase()}] Sample rule:`, {
      id: allRules[0].id,
      rule_name: allRules[0].rule_name,
      rule_type: allRules[0].rule_type,
      status: allRules[0].status,
      is_active: allRules[0].is_active,
      conditions: typeof allRules[0].conditions === 'string' ? 'string' : 'object'
    });
  }
  
  // More lenient filtering - accept if either status is active OR is_active is true
  const activeRules = allRules.filter((rule: any) => {
    const isActive = rule.status === 'active' || 
                     rule.is_active === '1' || 
                     rule.is_active === 1 || 
                     rule.is_active === true;
    return isActive;
  });

  console.log(`✅ [${apiEnv.toUpperCase()}] Loaded ${activeRules.length} active rules (from ${allRules.length} total)`);
  return activeRules;
}

// Find blueprint assignment from cached data (environment-aware)
function findBlueprintAssignmentFromCache(productId: number, categoryIds: number[] = [], apiEnv: ApiEnvironment = 'production') {
  const envCache = blueprintCache[apiEnv];
  if (!envCache?.assignments) {
    console.log(`   ⚠️ No assignments in cache for ${apiEnv}`);
    return null;
  }

  console.log(`   🔍 Finding assignment for product ${productId} with categories [${categoryIds}]`);
  console.log(`   📚 Available assignments:`, envCache.assignments.length);

  // Check for direct product assignment first
  const directAssignment = envCache.assignments.find((assignment: any) => 
    assignment.entity_type === 'product' && assignment.entity_id === productId
  );
  
  if (directAssignment) {
    console.log(`   ✓ Found direct product assignment:`, directAssignment);
    return directAssignment;
  }

  // Check for category-based assignment
  if (categoryIds.length > 0) {
    const categoryAssignments = envCache.assignments.filter((assignment: any) => 
      assignment.entity_type === 'category'
    );
    
    console.log(`   🔍 Checking ${categoryAssignments.length} category assignments`);
    
    for (const categoryId of categoryIds) {
      const assignment = categoryAssignments.find((assignment: any) => 
        assignment.category_id === categoryId
      );
      if (assignment) {
        console.log(`   ✓ Found category assignment for cat ${categoryId}:`, assignment);
        return assignment;
      } else {
        console.log(`   ❌ No assignment found for category ${categoryId}`);
      }
    }
  }

  console.log(`   ❌ No assignment found for product ${productId}`);
  return null;
}

// Find blueprint rules from cached data (environment-aware)
function findBlueprintRulesFromCache(blueprintId: number, apiEnv: ApiEnvironment = 'production') {
  const envCache = blueprintCache[apiEnv];
  if (!envCache?.rules) return [];

  return envCache.rules.filter((rule: any) => {
    try {
      const conditions = JSON.parse(rule.conditions || '{}');
      const ruleBlueprintId = conditions.blueprint_id;
      return ruleBlueprintId && parseInt(ruleBlueprintId.toString()) === parseInt(blueprintId.toString());
    } catch (e) {
      return false;
    }
  });
}



// Helper function to convert rules to grouped tiers
function convertRulesToGroupedTiers(rules: any[]) {
  const ruleGroups: any[] = [];

  for (const rule of rules) {
    try {
      // Parse conditions if it's a string
      let conditions = rule.conditions;
      if (typeof conditions === 'string') {
        try {
          conditions = JSON.parse(conditions);
        } catch (e) {
          conditions = {};
        }
      }

      // Extract and validate conversion ratio if present
      let conversion_ratio = undefined;
      if (conditions.use_conversion_ratio && conditions.conversion_ratio) {
        const cr = conditions.conversion_ratio;
        
        try {
          // Comprehensive validation of conversion ratio data
          const isValid = 
            cr &&
            typeof cr.input_amount === 'number' &&
            typeof cr.output_amount === 'number' &&
            cr.input_amount > 0 &&
            cr.output_amount > 0 &&
            !isNaN(cr.input_amount) &&
            !isNaN(cr.output_amount) &&
            isFinite(cr.input_amount) &&
            isFinite(cr.output_amount) &&
            cr.input_unit &&
            cr.output_unit &&
            typeof cr.input_unit === 'string' &&
            typeof cr.output_unit === 'string' &&
            cr.input_unit.length > 0 &&
            cr.output_unit.length > 0;
            
          if (isValid) {
            conversion_ratio = {
              input_amount: cr.input_amount,
              input_unit: cr.input_unit,
              output_amount: cr.output_amount,
              output_unit: cr.output_unit,
              description: cr.description || ''
            };
            
            // Test calculation to ensure it doesn't break
            const testCalc = 1 * conversion_ratio.input_amount / conversion_ratio.output_amount;
            if (isNaN(testCalc) || !isFinite(testCalc)) {
              throw new Error(`Conversion calculation produces invalid result: ${testCalc}`);
            }
          } else {
            // Invalid conversion ratio - will be ignored
          }
        } catch (error) {
          conversion_ratio = undefined;
        }
      }

      if (rule.rule_type === 'quantity_break') {
        const ruleTiers: any[] = [];
        
        // Handle both quantity_breaks and categories formats
        if (conditions.quantity_breaks) {
          // Original quantity_breaks format
          for (const qb of conditions.quantity_breaks) {
            const label = `${qb.min_quantity}${qb.max_quantity ? `-${qb.max_quantity}` : '+'} ${conditions.unit || 'units'}`;
            
            ruleTiers.push({
              min: qb.min_quantity,
              max: qb.max_quantity,
              price: parseFloat(qb.price_per_unit),
              unit: conditions.unit || 'unit',
              label,
              ruleName: rule.rule_name,
              conversion_ratio
            });
          }
        } else if (conditions.categories) {
          // New categories format (moonwater blueprint style)
          for (const [categoryName, categoryData] of Object.entries(conditions.categories)) {
            const catData = categoryData as any;
            const label = categoryName;
            
            ruleTiers.push({
              min: catData.quantity || 1,
              max: catData.quantity || null,
              price: parseFloat(catData.price),
              unit: conditions.unit_type || 'unit',
              label,
              ruleName: rule.rule_name,
              conversion_ratio
            });
          }
        } else if (conditions.tiers) {
          // Handle tiers format (flower/concentrate blueprint style)
          for (const tier of conditions.tiers) {
            const label = tier.name || `${tier.min_quantity}${tier.max_quantity ? `-${tier.max_quantity}` : '+'} ${conditions.unit_type || 'units'}`;
            
            ruleTiers.push({
              min: tier.min_quantity,
              max: tier.max_quantity,
              price: parseFloat(tier.price),
              unit: conditions.unit_type || 'unit',
              label,
              ruleName: rule.rule_name,
              conversion_ratio
            });
          }
        }

        if (ruleTiers.length > 0) {
          ruleGroups.push({
            ruleName: rule.rule_name,
            ruleId: rule.id.toString(),
            productType: conditions.product_type || conditions.blueprint_name || 'general',
            tiers: ruleTiers.sort((a, b) => a.min - b.min)
          });
        }
      }
    } catch (error) {
      // Skip invalid rule
      console.warn('Skipping invalid rule:', rule.id, error);
    }
  }

  return ruleGroups;
}

// Helper function to get product name from WooCommerce API
async function getProductName(productId: number, apiEnv: ApiEnvironment): Promise<string | null> {
  try {
    const baseUrl = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials();
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`);
    
    if (!response.ok) {
      return null;
    }
    
    const product = await response.json();
    return product.name || null;
  } catch (error) {
    console.error(`Error fetching product name for ${productId}:`, error);
    return null;
  }
}
