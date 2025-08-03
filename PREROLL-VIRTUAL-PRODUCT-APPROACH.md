# Pre-Roll Virtual Product Approach

## Overview

Instead of treating pre-rolls as metadata or variations within flower products, we're pivoting to create separate virtual products for pre-rolls that are linked to their source flower inventory.

## Current System Problems

1. **No Distinct SKUs**: Pre-rolls don't have their own SKUs for tracking
2. **Poor Tax Control**: Can't apply different tax rates to pre-rolls vs flower
3. **No Itemization**: Orders show "Purple Punch" instead of "Purple Punch Pre-rolls"
4. **Complex Logic**: Virtual inventory stored as metadata is hard to manage
5. **No Reporting**: Can't track pre-roll sales separately

## New Approach: Virtual Products

### Product Structure

```
Flower Product                    Virtual Pre-roll Product
--------------                    -----------------------
Name: Purple Punch               Name: Purple Punch Pre-rolls
SKU: PP-FLW                     SKU: PP-PR
Stock: 700g                     Stock: 0 (virtual)
Price: $10/g                    Price: $6/pre-roll
                                Meta: source_flower_id = PP-FLW
                                Meta: conversion_rate = 0.7g
```

### Key Benefits

1. **Proper SKUs**: Each form has its own SKU for tracking
2. **Tax Flexibility**: Different tax rates per product type
3. **Clear Itemization**: Orders show "3x Purple Punch Pre-rolls"
4. **Native WooCommerce**: Works with existing reporting
5. **Scalable**: Easy to add new forms (e.g., infused pre-rolls)

## Implementation Plan

### Phase 1: Create Virtual Products

1. **Migration Script** (`/test-preroll-migration`):
   - Scan flower products with pre-roll pricing
   - Generate virtual pre-roll products
   - Link via `source_flower_id` metadata

2. **Product Metadata**:
   ```json
   {
     "_virtual_product": "yes",
     "_source_flower_id": "792",
     "_conversion_rate": "0.7",
     "_bundle_pricing": {"1": 6, "3": 15, "5": 24},
     "_product_type": "preroll"
   }
   ```

### Phase 2: Update Addify Plugin

Modify inventory deduction to handle virtual products:

```php
// In class-addify-multi-location-inventory-admin.php
function deduct_inventory($order_item) {
    $product_id = $order_item->get_product_id();
    $product = wc_get_product($product_id);
    
    // Check if virtual pre-roll product
    $source_flower_id = get_post_meta($product_id, '_source_flower_id', true);
    if ($source_flower_id) {
        $conversion_rate = get_post_meta($product_id, '_conversion_rate', true) ?: 0.7;
        $quantity = $order_item->get_quantity();
        $grams_to_deduct = $quantity * $conversion_rate;
        
        // Deduct from source flower inventory
        $this->deduct_flower_inventory($source_flower_id, $grams_to_deduct, $location_id);
        
        // Log the deduction
        wc_add_order_item_meta($order_item->get_id(), '_flower_deducted', $grams_to_deduct);
        wc_add_order_item_meta($order_item->get_id(), '_source_flower_id', $source_flower_id);
    }
}
```

### Phase 3: Update Frontend

1. **Product Display**:
   - Show pre-rolls as separate products
   - Calculate availability from flower stock
   - Display "ready" vs "make fresh" status

2. **Modified ProductCard**:
   ```tsx
   // For virtual pre-roll products
   const calculateAvailability = () => {
     const sourceFlower = products.find(p => p.id === product.source_flower_id)
     const canMake = Math.floor(sourceFlower.stock_quantity / product.conversion_rate)
     const ready = sourceFlower.virtual_preroll_count || 0
     
     return {
       total: ready + canMake,
       ready: ready,
       makeOnDemand: canMake
     }
   }
   ```

3. **Cart Handling**:
   - Add virtual products normally
   - Show proper product names
   - Calculate correct taxes

### Phase 4: Order Processing

1. **Order Creation**:
   - Virtual products create normal line items
   - Proper SKUs in order details
   - Correct tax calculations

2. **Inventory Updates**:
   - Hook into order completion
   - Deduct from linked flower inventory
   - Update virtual pre-roll counts

## Migration Path

### Step 1: Test Migration
Visit `/test-preroll-migration` to preview how products will be migrated

### Step 2: Create Products
Run migration script to create virtual pre-roll products in WooCommerce

### Step 3: Update Plugin
Deploy modified Addify plugin with virtual product support

### Step 4: Update Frontend
Switch product display to show separate pre-roll products

### Step 5: Clean Up
Remove old pre-roll variation logic and metadata

## Technical Details

### Inventory Calculation
```typescript
// When pre-roll is sold
if (product.isVirtual && product.sourceFlowerId) {
  const virtualUsed = Math.min(quantity, virtualPrerollsAvailable)
  const makeOnDemand = quantity - virtualUsed
  const flowerNeeded = makeOnDemand * conversionRate
  
  // Deduct virtual inventory
  updateVirtualCount(product.sourceFlowerId, -virtualUsed)
  
  // Deduct flower inventory
  updateFlowerStock(product.sourceFlowerId, -flowerNeeded)
}
```

### Stock Display
```typescript
// Show combined availability
const flowerStock = sourceFlower.stock_quantity
const virtualReady = sourceFlower.virtual_preroll_count
const canMake = Math.floor(flowerStock / 0.7)
const totalAvailable = virtualReady + canMake

// Display: "15 available (5 ready, 10 can make)"
```

## Advantages Over Current System

| Feature | Current (Metadata) | New (Virtual Products) |
|---------|-------------------|----------------------|
| SKU Tracking | ❌ None | ✅ PP-PR |
| Tax Control | ❌ Shared | ✅ Separate |
| Reporting | ❌ Manual | ✅ Native |
| Refunds | ❌ Complex | ✅ Standard |
| Scalability | ❌ Limited | ✅ Extensible |
| WooCommerce | ⚠️ Hacky | ✅ Native |

## Next Steps

1. Review migration preview at `/test-preroll-migration`
2. Approve virtual product structure
3. Run migration to create products
4. Test with small batch
5. Deploy plugin updates
6. Switch frontend to new system

## Questions to Consider

1. **Bundle Pricing**: Should we create separate products for bundles (3-pack, 5-pack)?
2. **Naming Convention**: "Purple Punch Pre-rolls" or "Purple Punch 0.7g Pre-rolls"?
3. **Categories**: New "Pre-rolls" category or keep under "Flower"?
4. **Images**: Use flower images or create pre-roll specific images?
5. **Descriptions**: Auto-generate from flower or custom? 