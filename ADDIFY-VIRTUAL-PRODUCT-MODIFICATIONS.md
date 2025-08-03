# Addify Plugin Modifications for Virtual Pre-Roll Products

## Summary

The Addify Multi-Location Inventory plugin has been modified to support virtual pre-roll products that are linked to flower inventory.

## Files Modified

### 1. `class-addify-multi-inventory-management.php`

Added the following methods:
- `af_mli_get_virtual_product_source()` - Detects if a product is virtual and gets source flower info
- `af_mli_handle_virtual_product_deduction()` - Handles inventory deduction for virtual products
- `af_mli_filter_virtual_stock_status()` - Filters WooCommerce stock status for virtual products
- `af_mli_filter_virtual_stock_quantity()` - Filters WooCommerce stock quantity display
- `af_mli_handle_virtual_product_refund()` - Handles refunds for virtual products

Added filters and actions:
```php
add_filter('woocommerce_product_get_stock_status', array($this, 'af_mli_filter_virtual_stock_status'), 10, 2);
add_filter('woocommerce_product_get_stock_quantity', array($this, 'af_mli_filter_virtual_stock_quantity'), 10, 2);
add_action('woocommerce_order_item_refunded', array($this, 'af_mli_handle_virtual_product_refund'), 10, 3);
```

### 2. `includes/admin/class-addify-multi-location-inventory-admin.php`

Modified inventory deduction to check for virtual products first:
- When a virtual pre-roll product is sold, it switches to the source flower product
- Deducts from flower inventory based on conversion rate
- Adds order item metadata for tracking

### 3. Third Location Deduction (in main plugin file)

Also added virtual product support in the third deduction location to ensure consistency.

## How It Works

1. **Virtual Product Detection**
   - Products with `_virtual_product = yes` metadata are detected
   - `_source_flower_id` links to the flower product
   - `_conversion_rate` defines grams per pre-roll (default 0.7g)

2. **Inventory Deduction**
   - When virtual pre-roll is sold, system finds source flower
   - Checks virtual pre-roll count first
   - Deducts remaining from flower stock
   - Logs all deductions with metadata

3. **Stock Display**
   - Virtual products show calculated availability
   - Based on source flower stock + virtual ready count
   - Updates in real-time

## Metadata Structure

Virtual pre-roll products have:
```
_virtual_product: "yes"
_source_flower_id: "786"
_conversion_rate: "0.7"
_product_type: "preroll"
```

Order items get:
```
_virtual_product_deduction: {
  source_flower_id: 786,
  virtual_used: 3,
  flower_deducted: 4.9,
  total_prerolls: 10,
  location_id: 30
}
```

## Testing

Before deploying:
1. Test virtual product creation
2. Test order placement with virtual products
3. Verify inventory deduction
4. Check stock display updates
5. Test refunds/returns

## Compatibility

- Works alongside existing virtual pre-roll system
- Backward compatible with current orders
- No breaking changes to existing functionality 