import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions for field update results
interface FieldResult {
  field: string;
  value?: string;
  prepared?: boolean;
  skipped?: boolean;
  reason?: string;
  success?: boolean;
  error?: string;
}

const FLORA_API_BASE = 'https://api.floradistro.com';

// Blueprint field mapping for concentrate products (Blueprint ID: 42)
const BLUEPRINT_FIELDS = {
  35: 'effect',      // Effect
  36: 'lineage',     // Lineage  
  37: 'nose',        // Nose
  38: 'terpene',     // Terpene
  39: 'strain_type', // Type
  40: 'thca_percentage' // Thca % (leave empty as requested)
};

// Product data with real strain information - All 18 concentrate products
const PRODUCTS_DATA = {
  41242: { // Tropic Fury Shatter
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Derived from Sunset Sherbet genetics',
    terpene: 'Limonene, Myrcene, Caryophyllene',
    nose: 'Pungent and pleasantly floral',
    effect: 'Relaxing body high, ideal for unwinding',
    thca_percentage: '' // Leave empty as requested
  },
  41243: { // Iced Berry Shatter
    strain_type: 'Balanced Hybrid',
    lineage: 'Cross between Ice Cream Cake and Berry OG',
    terpene: 'Limonene, Linalool, Caryophyllene',
    nose: 'Sweet berry fragrance with vanilla and cream undertones',
    effect: 'Balanced euphoria and relaxation, enhancing creativity',
    thca_percentage: ''
  },
  41244: { // Banana Sherb Shatter
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Cross between Banana Kush and Sunset Sherbet',
    terpene: 'Myrcene, Limonene, Pinene',
    nose: 'Sweet banana with hints of citrus and earth',
    effect: 'Euphoric and uplifting, promoting creativity and relaxation',
    thca_percentage: ''
  },
  41245: { // Yellow Zushi
    strain_type: 'Balanced Hybrid',
    lineage: 'Cross between Zkittlez and Kush Mints',
    terpene: 'Limonene, Caryophyllene, Pinene',
    nose: 'Sweet and fruity with hints of mint',
    effect: 'Balanced high providing relaxation and mental clarity',
    thca_percentage: ''
  },
  41246: { // Lemon Cherry Runtz
    strain_type: 'Sativa-Dominant Hybrid',
    lineage: 'Cross between Lemon Tree and Cherry Runtz',
    terpene: 'Limonene, Myrcene, Caryophyllene, Pinene',
    nose: 'Citrusy lemon with sweet cherry notes',
    effect: 'Euphoric and uplifting, followed by gentle relaxation',
    thca_percentage: ''
  },
  41247: { // Fig Bar Shatter
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Proprietary genetics with fruity lineage',
    terpene: 'Myrcene, Linalool, Caryophyllene',
    nose: 'Sweet fig with earthy and spicy notes',
    effect: 'Relaxing and calming, perfect for evening use',
    thca_percentage: ''
  },
  41237: { // Hash Heads Rosin Fatso 1.25
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Fatso lineage with OG Kush genetics',
    terpene: 'Myrcene, Caryophyllene, Limonene',
    nose: 'Earthy and gassy with hints of vanilla',
    effect: 'Heavy body relaxation, perfect for evening',
    thca_percentage: ''
  },
  41236: { // Hash Heads Rosin Mac Cocktail 1.25
    strain_type: 'Balanced Hybrid',
    lineage: 'MAC (Miracle Alien Cookies) cross',
    terpene: 'Limonene, Caryophyllene, Pinene',
    nose: 'Citrusy and creamy with alien-like funk',
    effect: 'Balanced cerebral and physical effects',
    thca_percentage: ''
  },
  41235: { // Shatter Chocolope Cookies
    strain_type: 'Sativa-Dominant Hybrid',
    lineage: 'Cross between Chocolope and GSC (Girl Scout Cookies)',
    terpene: 'Limonene, Pinene, Myrcene',
    nose: 'Chocolate and coffee with sweet cookie notes',
    effect: 'Energizing and uplifting, great for daytime',
    thca_percentage: ''
  },
  41234: { // Shatter Gas Fudge
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Gassy genetics with dessert lineage',
    terpene: 'Myrcene, Caryophyllene, Linalool',
    nose: 'Fuel and chocolate with sweet undertones',
    effect: 'Relaxing and sedating, ideal for nighttime',
    thca_percentage: ''
  },
  41233: { // Shatter Molotov Cocktail
    strain_type: 'Sativa-Dominant Hybrid',
    lineage: 'High-energy genetics with explosive flavor',
    terpene: 'Limonene, Pinene, Caryophyllene',
    nose: 'Spicy and citrusy with fuel notes',
    effect: 'Energetic and cerebral, creative boost',
    thca_percentage: ''
  },
  41232: { // Shatter Strawberry Shortcake
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Cross between Strawberry and Shortbread genetics',
    terpene: 'Myrcene, Linalool, Limonene',
    nose: 'Sweet strawberry with creamy vanilla notes',
    effect: 'Calming and euphoric, perfect for relaxation',
    thca_percentage: ''
  },
  41231: { // Shatter Guava Cake
    strain_type: 'Balanced Hybrid',
    lineage: 'Wedding Cake crossed with Guava genetics',
    terpene: 'Limonene, Caryophyllene, Myrcene',
    nose: 'Tropical guava with sweet cake batter',
    effect: 'Balanced high with creative and relaxing effects',
    thca_percentage: ''
  },
  725: { // Cake Pie
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Wedding Cake and Cherry Pie cross',
    terpene: 'Myrcene, Caryophyllene, Linalool',
    nose: 'Sweet cherry with vanilla cake notes',
    effect: 'Deeply relaxing, ideal for stress relief',
    thca_percentage: ''
  },
  719: { // Skunk Juice
    strain_type: 'Sativa-Dominant Hybrid',
    lineage: 'Classic Skunk genetics with citrus enhancement',
    terpene: 'Limonene, Pinene, Myrcene',
    nose: 'Skunky and pungent with citrus undertones',
    effect: 'Uplifting and energetic, classic sativa effects',
    thca_percentage: ''
  },
  713: { // Candyland
    strain_type: 'Sativa-Dominant Hybrid',
    lineage: 'Granddaddy Purple crossed with Bay Platinum Cookies',
    terpene: 'Limonene, Caryophyllene, Pinene',
    nose: 'Sweet and fruity with candy-like aroma',
    effect: 'Euphoric and uplifting, great for social activities',
    thca_percentage: ''
  },
  707: { // Apple Tart
    strain_type: 'Balanced Hybrid',
    lineage: 'Apple genetics with dessert strain lineage',
    terpene: 'Limonene, Myrcene, Pinene',
    nose: 'Crisp apple with sweet pastry notes',
    effect: 'Balanced effects with creative and relaxing qualities',
    thca_percentage: ''
  },
  701: { // Cinnamon Slice
    strain_type: 'Indica-Dominant Hybrid',
    lineage: 'Spice-forward genetics with dessert influence',
    terpene: 'Myrcene, Caryophyllene, Linalool',
    nose: 'Warm cinnamon with sweet baked goods aroma',
    effect: 'Relaxing and comforting, perfect for evening use',
    thca_percentage: ''
  }
};

export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    console.log('🔄 Starting Flora Fields blueprint field update for concentrate products...');
    
    const results = [];
    let totalUpdated = 0;
    
    for (const [productId, fieldValues] of Object.entries(PRODUCTS_DATA)) {
      console.log(`\n🔄 Updating product ID: ${productId}`);
      
      const productResults: FieldResult[] = [];
      let productUpdated = 0;
      
      // Prepare all blueprint fields for this product
      const blueprintFieldsToUpdate: Record<string, string> = {};
      
      for (const [blueprintFieldId, fieldName] of Object.entries(BLUEPRINT_FIELDS)) {
        const fieldValue = fieldValues[fieldName as keyof typeof fieldValues] || '';
        
        // Skip empty thca_percentage as requested
        if (fieldName === 'thca_percentage' && !fieldValue) {
          console.log(`  - Skipping ${fieldName} (intentionally left empty)`);
          productResults.push({
            field: fieldName,
            skipped: true,
            reason: 'intentionally empty'
          });
          continue;
        }
        
        if (fieldValue) {
          blueprintFieldsToUpdate[fieldName] = fieldValue;
          productResults.push({
            field: fieldName,
            value: fieldValue,
            prepared: true
          });
          productUpdated++;
        }
      }
      
      // Save blueprint field values directly to the Flora Fields database
      if (Object.keys(blueprintFieldsToUpdate).length > 0) {
        try {
          console.log(`  🔄 Saving ${Object.keys(blueprintFieldsToUpdate).length} blueprint fields via V3 Native API...`);
          
          // Save field values using V3 Native API (stores in WordPress post meta)
          const response = await fetch(
            `${FLORA_API_BASE}/wp-json/fd/v3/products/${parseInt(productId)}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fields: blueprintFieldsToUpdate
              })
            }
          );
          
          if (response.ok) {
            const responseData = await response.json();
            console.log(`  ✅ Successfully updated all fields for product ${productId}`);
            
            // Mark all prepared fields as successful
            productResults.forEach(result => {
              if (result.prepared) {
                result.success = true;
                delete result.prepared;
                totalUpdated++;
              }
            });
            
          } else {
            const errorText = await response.text();
            console.error(`  ❌ Failed to update product ${productId}: ${response.status} ${errorText}`);
            
            // Mark all prepared fields as failed
            productResults.forEach(result => {
              if (result.prepared) {
                result.success = false;
                result.error = `HTTP ${response.status}: ${errorText}`;
                delete result.prepared;
              }
            });
          }
          
        } catch (error) {
          console.error(`  ❌ Error updating product ${productId}:`, error);
          
          // Mark all prepared fields as failed
          productResults.forEach(result => {
            if (result.prepared) {
              result.success = false;
              result.error = error instanceof Error ? error.message : 'Unknown error';
              delete result.prepared;
            }
          });
        }
      }
      
      console.log(`  📊 Updated ${productUpdated} fields for product ${productId}`);
      
      results.push({
        productId: parseInt(productId),
        fieldsUpdated: productUpdated,
        totalFields: Object.keys(BLUEPRINT_FIELDS).length,
        fieldResults: productResults
      });
      
      // Delay between products
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 Blueprint field update complete!`);
    console.log(`📊 Summary: ${totalUpdated} fields updated across ${Object.keys(PRODUCTS_DATA).length} products`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdated} blueprint fields across ${Object.keys(PRODUCTS_DATA).length} products`,
      results,
      summary: {
        totalProducts: Object.keys(PRODUCTS_DATA).length,
        totalFieldsUpdated: totalUpdated,
        fieldsPerProduct: Object.keys(BLUEPRINT_FIELDS).length - 1 // -1 for empty thca_percentage
      }
    });
    
  } catch (error) {
    console.error('Flora Fields blueprint update error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update Flora Fields blueprint data' 
      },
      { status: 500 }
    );
  }
}
