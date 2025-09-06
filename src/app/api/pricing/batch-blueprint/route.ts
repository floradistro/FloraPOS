import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_URL = 'https://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Cache for blueprint data to avoid repeated API calls
let blueprintCache: {
  assignments?: any[];
  rules?: any[];
  lastFetch?: number;
} = {};

const CACHE_DURATION = 60000; // 1 minute cache

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({
        success: false,
        error: 'products array is required'
      }, { status: 400 });
    }

    console.log(`🔄 Batch fetching blueprint pricing for ${products.length} products`);

    // Load all blueprint data once at the start
    await loadBlueprintData();

    const results: Record<number, any> = {};

    // Process all products using cached data
    for (const product of products) {
      const { id: productId, categoryIds = [] } = product;
      
      try {
        // Find blueprint assignment from cache
        const assignment = findBlueprintAssignmentFromCache(productId, categoryIds);
        
        if (!assignment) {
          results[productId] = null;
          continue;
        }

        // Get pricing rules for the blueprint from cache
        const pricingRules = findBlueprintRulesFromCache(assignment.blueprint_id);

        if (!pricingRules || pricingRules.length === 0) {
          results[productId] = null;
          continue;
        }

        results[productId] = {
          productId,
          blueprintId: assignment.blueprint_id,
          blueprintName: assignment.blueprint_name,
          ruleGroups: convertRulesToGroupedTiers(pricingRules)
        };

      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        results[productId] = null;
      }
    }

    console.log(`✅ Batch blueprint pricing completed for ${products.length} products using cached data`);

    return NextResponse.json({
      success: true,
      data: results
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
async function loadBlueprintData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (blueprintCache.assignments && blueprintCache.rules && 
      blueprintCache.lastFetch && (now - blueprintCache.lastFetch) < CACHE_DURATION) {
    return;
  }

  console.log('🔄 Loading fresh blueprint data...');

  try {
    // Load assignments and rules in parallel
    const [assignments, rules] = await Promise.all([
      loadBlueprintAssignments(),
      loadAllPricingRules()
    ]);

    blueprintCache = {
      assignments,
      rules,
      lastFetch: now
    };

    console.log(`✅ Cached ${assignments.length} assignments and ${rules.length} pricing rules`);
  } catch (error) {
    console.error('Error loading blueprint data:', error);
    // Use existing cache if available, otherwise empty arrays
    if (!blueprintCache.assignments) {
      blueprintCache.assignments = [];
    }
    if (!blueprintCache.rules) {
      blueprintCache.rules = [];
    }
  }
}

// Load blueprint assignments once
async function loadBlueprintAssignments() {
  const url = `${FLORA_API_URL}/wp-json/fd/v1/blueprint-assignments?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&_t=${Date.now()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'POSV1/1.0'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Blueprint assignments API error: ${response.status}`);
  }

  return await response.json();
}

// Load all pricing rules once
async function loadAllPricingRules() {
  const url = `${FLORA_API_URL}/wp-json/fd/v1/pricing-rules?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}&_t=${Date.now()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'POSV1/1.0'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Pricing rules API error: ${response.status}`);
  }

  const result = await response.json();
  
  // Filter for active rules only
  const activeRules = (result.rules || []).filter((rule: any) => 
    rule.status === 'active' && rule.is_active === '1'
  );

  return activeRules;
}

// Find blueprint assignment from cached data
function findBlueprintAssignmentFromCache(productId: number, categoryIds: number[] = []) {
  if (!blueprintCache.assignments) return null;

  // Check for direct product assignment first
  const directAssignment = blueprintCache.assignments.find((assignment: any) => 
    assignment.entity_type === 'product' && assignment.entity_id === productId
  );
  
  if (directAssignment) {
    return directAssignment;
  }

  // Check for category-based assignment
  if (categoryIds.length > 0) {
    const categoryAssignments = blueprintCache.assignments.filter((assignment: any) => 
      assignment.entity_type === 'category'
    );
    
    for (const categoryId of categoryIds) {
      const assignment = categoryAssignments.find((assignment: any) => 
        assignment.category_id === categoryId
      );
      if (assignment) {
        return assignment;
      }
    }
  }

  return null;
}

// Find blueprint rules from cached data
function findBlueprintRulesFromCache(blueprintId: number) {
  if (!blueprintCache.rules) return [];

  return blueprintCache.rules.filter((rule: any) => {
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
