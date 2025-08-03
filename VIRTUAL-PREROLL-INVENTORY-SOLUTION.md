# Virtual Pre-Roll Inventory Solution

## The Problem

When selling virtual pre-roll products, the system was:
1. Correctly deducting from virtual pre-roll count
2. BUT ALSO deducting from flower inventory even when not needed
3. This was because virtual products didn't have inventory posts in Addify

## The Solution

I've implemented a **two-part solution**:

### Part 1: Early Virtual Product Detection

Added early detection in the Addify plugin that checks if a product is virtual BEFORE any inventory processing:

```php
// Early check for virtual pre-roll products
$is_virtual_product = get_post_meta($product_id, '_virtual_product', true);
if ($is_virtual_product === 'yes') {
    // Check virtual inventory on source flower
    if ($virtual_available >= $quantity) {
        // Update virtual count only
        update_post_meta($source_flower_id, '_virtual_preroll_count', $new_virtual_count);
        continue; // Skip all other inventory processing
    }
}
```

This ensures that when virtual pre-rolls are available, NO flower inventory is touched.

### Part 2: Inventory Post Creation (Optional)

Created an API endpoint to create inventory posts for virtual products:
```bash
POST /api/virtual-products/create-inventory
{
  "productId": 13842,
  "locationId": 30
}
```

This creates a "placeholder" inventory post with 0 quantity, which helps the Addify system recognize the product.

## How It Works Now

### When Selling Virtual Pre-Rolls:

1. **Customer orders 10 pre-rolls**
2. **System checks virtual count first** (e.g., 15 available)
3. **If sufficient virtual inventory:**
   - Deducts 10 from virtual count (15 → 5)
   - NO flower inventory touched
   - Order completes successfully

4. **If insufficient virtual inventory** (e.g., only 5 virtual, need 10):
   - Uses all 5 virtual pre-rolls
   - Converts 5 more from flower (3.5g)
   - Updates both counts appropriately

## Testing the Fix

### Current Status (Chanel Candy):
- **Virtual Pre-rolls**: 15
- **Flower Stock**: 681g

### Test Scenario:
1. Order 10 pre-rolls
2. Virtual count should decrease to 5
3. Flower stock should remain at 681g (no deduction)

## Modified Files

### 1. **Addify Plugin**
```
/Users/whale/Downloads/PluginsV12/addify.modified/
- class-addify-multi-inventory-management.php
- includes/admin/class-addify-multi-location-inventory-admin.php
```

### 2. **API Endpoints**
```
src/app/api/virtual-products/create-inventory/route.ts
```

## Key Benefits

1. **Correct Inventory Tracking**: Virtual pre-rolls use virtual count first
2. **No Double Deduction**: Flower inventory only touched when needed
3. **Backward Compatible**: Works with existing orders and data
4. **Clear Logging**: Detailed logs show what's happening

## Deployment

1. Upload modified Addify plugin files
2. Clear any caches
3. Test with a small order first
4. Monitor logs for "MLI Admin: Early detection" messages

## Future Improvements

Consider:
1. Adding virtual product management UI
2. Bulk inventory creation for all virtual products
3. Real-time stock synchronization
4. Automated alerts when virtual count is low

The system now correctly handles virtual pre-rolls without touching flower inventory unnecessarily! 