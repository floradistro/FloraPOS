import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials, type ApiEnvironment } from '@/lib/server-api-config';

const CACHE_DURATION = 120000; // 2 minute cache (increased from 10 seconds for better performance)
const CACHE_VERSION = 'v17_type_coercion_fix'; // Increment this to bust all caches - Fixed category ID type matching

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

// Load blueprint assignments from category fields (V3 Native API)
async function loadBlueprintAssignments(apiEnv: ApiEnvironment) {
  const baseUrl = getApiBaseUrl(apiEnv);
  const credentials = getApiCredentials(apiEnv);
  
  console.log(`\n🔍 [${apiEnv.toUpperCase()}] Building blueprint assignments from V3 native category fields...`);
  
  // Category IDs to check (Production: Flower=25, Concentrate=22, Edibles=21, Vape=19, Moonwater=16)
  const categoryIds = apiEnv === 'docker' 
    ? [16, 17, 18, 19, 20]  // Docker: Concentrate, Edibles, Flower, Moonwater, Vape
    : [22, 21, 25, 16, 19]; // Production: Concentrate, Edibles, Flower, Moonwater, Vape
  const allAssignments: any[] = [];
  
  for (const categoryId of categoryIds) {
    try {
      // V3 Native API endpoint
      const url = `${baseUrl}/wp-json/fd/v3/categories/${categoryId}/fields?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}&_t=${Date.now()}`;
      
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
        const assignedFields = result.assigned_fields || {};
        
        console.log(`   📊 Category ${categoryId} returned ${Object.keys(assignedFields).length} fields from native storage`);
        
        // Group fields by 'group' property (this defines pricing tier blueprints)
        const groupedByLabel: Record<string, any[]> = {};
        Object.entries(assignedFields).forEach(([fieldName, fieldConfig]: [string, any]) => {
          const groupLabel = fieldConfig.group || 'default';
          if (!groupedByLabel[groupLabel]) {
            groupedByLabel[groupLabel] = [];
          }
          groupedByLabel[groupLabel].push({
            name: fieldName,
            ...fieldConfig
          });
        });
        
        console.log(`   📁 Grouped into ${Object.keys(groupedByLabel).length} groups:`, Object.keys(groupedByLabel));
        
        // Create one assignment per group - only for pricing blueprint groups
        const skipGroups = ['default', '', 'null'];
        
        Object.entries(groupedByLabel).forEach(([groupLabel, groupFields]) => {
          if (skipGroups.includes(groupLabel)) {
            console.log(`      ⏭️  Skipping utility group: ${groupLabel}`);
            return;
          }
          
          // Use hash of group label as blueprint ID for consistency
          const blueprintId = Math.abs(groupLabel.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0));
          
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
        console.log(`   ❌ Category ${categoryId} V3 API returned status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Failed to fetch fields for category ${categoryId}:`, error);
    }
  }
  
  console.log(`✅ [${apiEnv.toUpperCase()}] Built ${allAssignments.length} blueprint assignments from V3 native field groups`);
  if (allAssignments.length > 0) {
    console.log(`   📋 All assignments created:`);
    allAssignments.forEach((a: any) => {
      console.log(`      → ${a.blueprint_name} (Blueprint ID ${a.blueprint_id}) → Category ${a.category_id}`);
    });
  } else {
    console.log(`   ⚠️  NO ASSIGNMENTS CREATED - Check if V3 API is returning fields for categories: ${categoryIds}`);
  }
  
  return allAssignments;
}

// Load all pricing tiers from native WooCommerce meta (V3 Native System)
async function loadAllPricingRules(apiEnv: ApiEnvironment) {
  const baseUrl = getApiBaseUrl(apiEnv);
  const credentials = getApiCredentials(apiEnv);
  
  console.log(`🔍 [${apiEnv.toUpperCase()}] Loading pricing tiers from V3 native WooCommerce meta...`);
  
  // V3 uses native product meta (_product_price_tiers) instead of custom pricing rules table
  // We need to fetch products and extract their pricing tiers from meta
  const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}&_t=${Date.now()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'POSV1/1.0'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error(`❌ [${apiEnv.toUpperCase()}] Products API error:`, response.status, response.statusText);
    throw new Error(`Products API error: ${response.status}`);
  }

  const products = await response.json();
  console.log(`📊 [${apiEnv.toUpperCase()}] Loaded ${products.length} products`);
  
  const allPricingData: any[] = [];
  
  // Extract pricing tiers from product meta_data
  for (const product of products) {
    if (!product.meta_data) continue;
    
    const priceTiersMeta = product.meta_data.find((meta: any) => meta.key === '_product_price_tiers');
    if (!priceTiersMeta || !priceTiersMeta.value) continue;
    
    try {
      const tiers = typeof priceTiersMeta.value === 'string' 
        ? JSON.parse(priceTiersMeta.value) 
        : priceTiersMeta.value;
      
      if (Array.isArray(tiers) && tiers.length > 0) {
        // Create a "rule" object that matches the old format for compatibility
        allPricingData.push({
          id: product.id,
          rule_name: product.name,
          rule_type: 'quantity_break',
          status: 'active',
          is_active: true,
          product_id: product.id,
          category_ids: product.categories.map((c: any) => c.id),
          conditions: JSON.stringify({
            product_id: product.id,
            unit_type: 'g',
            tiers: tiers.map((tier: any) => ({
              min_quantity: tier.qty || 1,
              max_quantity: null,
              price: tier.price,
              name: tier.weight || tier.label || `${tier.qty}x`
            }))
          })
        });
      }
    } catch (error) {
      console.warn(`⚠️  Failed to parse pricing tiers for product ${product.id}:`, error);
    }
  }

  console.log(`✅ [${apiEnv.toUpperCase()}] Loaded ${allPricingData.length} products with native pricing tiers`);
  return allPricingData;
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
        parseInt(assignment.category_id.toString()) === parseInt(categoryId.toString())
      );
      if (assignment) {
        console.log(`   ✓ Found category assignment for cat ${categoryId}:`, assignment);
        return assignment;
      } else {
        console.log(`   ❌ No assignment found for category ${categoryId} (type: ${typeof categoryId})`);
        console.log(`   📋 Available category IDs in assignments:`, categoryAssignments.map((a: any) => `${a.category_id} (type: ${typeof a.category_id})`));
      }
    }
  }

  console.log(`   ❌ No assignment found for product ${productId}`);
  return null;
}

// Find pricing rules for products matching the blueprint's category (environment-aware)
function findBlueprintRulesFromCache(blueprintId: number, apiEnv: ApiEnvironment = 'production') {
  const envCache = blueprintCache[apiEnv];
  if (!envCache?.rules || !envCache?.assignments) return [];

  // Find the category ID for this blueprint
  const assignment = envCache.assignments.find((a: any) => 
    a.blueprint_id === blueprintId && a.entity_type === 'category'
  );
  
  if (!assignment) {
    console.log(`   ⚠️  No assignment found for blueprint ${blueprintId}`);
    return [];
  }

  const categoryId = assignment.category_id;
  console.log(`   🔍 Finding pricing rules for blueprint ${blueprintId} (category ${categoryId})`);

  // Return all rules that match this category
  return envCache.rules.filter((rule: any) => {
    return rule.category_ids && rule.category_ids.includes(categoryId);
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
    const credentials = getApiCredentials(apiEnv);
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
