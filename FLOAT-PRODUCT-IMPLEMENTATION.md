# Float Product Implementation Guide

## Overview

The "Float Product" feature allows flower products to automatically create linked pre-roll products and manage conversions between them. When enabled, the system:

1. Creates a separate pre-roll product (with its own SKU)
2. Adds it to all inventory locations
3. Tracks virtual pre-roll inventory per location
4. Enables on-demand conversion from flower to pre-rolls

## How It Works

### 1. Product Setup (Admin Side)

When editing a flower product in WooCommerce:

1. Go to **Product > Inventory** tab
2. Enable **"Use Multi Inventory?"**
3. Set **Product Inventory Type** to "Weight Based (Grams)"
4. Set **Pre-roll Conversion** rate (e.g., 0.7g per pre-roll)
5. Check **"Is Float Product?"** ✓

When saved, the system automatically:
- Creates a pre-roll product (SKU: `[FLOWER-SKU]-PR`)
- Assigns it to the "Pre-Roll" category
- Creates inventory entries at all locations where the flower exists
- Links both products together

### 2. API Endpoints

#### Convert Flower to Pre-Rolls
```
POST /wp-json/addify-mli/v1/float-products/convert
{
  "product_id": 7851,
  "quantity": 5,
  "location_id": 32
}
```

This endpoint:
- Deducts flower inventory (quantity × conversion_rate)
- Adds to virtual pre-roll count at the location
- Logs the conversion

#### Get Float Product Info
```
GET /wp-json/addify-mli/v1/float-products/7851?location_id=32
```

Returns:
- Flower stock at location
- Virtual pre-roll count
- Maximum pre-rolls that can be made
- Linked pre-roll product details

#### Create Float Product Link
```
POST /wp-json/addify-mli/v1/float-products/create-link
{
  "product_id": 7851
}
```

Manually creates the pre-roll product link if needed.

### 3. Frontend Integration

The `VirtualPrerollSection` component:
- Only shows on products marked as float products
- Displays virtual inventory and conversion capability
- Allows staff to convert flower to pre-rolls
- Updates in real-time after conversions

### 4. Inventory Management

#### Flower Product Inventory
- Tracked in grams at each location
- Reduced when converting to pre-rolls
- Normal sales deduct from this inventory

#### Pre-Roll Product Inventory
- Virtual count tracked per location in `_virtual_preroll_count`
- Physical stock always shows as 0
- When sold, deducts from virtual count first
- If insufficient virtual, can convert on-demand from flower

## Database Structure

### Product Metadata

**Flower Product:**
```
mli_is_float_product: yes
mli_preroll_conversion: 0.7
_linked_preroll_product_id: 8234
```

**Pre-Roll Product:**
```
_virtual_product: yes
_product_type: preroll
_source_flower_product_id: 7851
_conversion_rate: 0.7
```

### Inventory Post Metadata

**Per Location:**
```
in_stock_quantity: 28.5 (for flower)
_virtual_preroll_count: 15 (for pre-rolls)
```

## Benefits

1. **Clean SKU Tracking**: Pre-rolls have their own SKU for reporting
2. **Location-Specific**: Each store tracks its own conversions
3. **Flexible Inventory**: Convert on-demand based on need
4. **Audit Trail**: All conversions are logged
5. **POS Compatible**: Works with existing POS systems

## Testing

1. Enable float product on a flower product
2. Check that pre-roll product was created
3. Visit `/preroll-diagnostics` to test API
4. Use the product grid to test UI conversion
5. Verify inventory deductions work correctly

## Troubleshooting

### Pre-roll product not created
- Ensure product type is "Weight Based"
- Check that pre-roll conversion rate is set
- Verify multi-inventory is enabled

### Conversion fails
- Check flower inventory at location
- Verify user has proper permissions
- Check browser console for API errors

### Virtual count not updating
- Ensure pre-roll inventory exists at location
- Check that location ID is being passed
- Verify metadata is being saved

## Code Files Modified

1. **Plugin Files:**
   - `addify.modified/includes/admin/product/class-addify-mli-product.php` - Added float product checkbox and creation logic
   - `addify.modified/rest-api/controllers/af-mli-float-product-controller.php` - New API controller
   - `addify.modified/class-addify-multi-inventory-management.php` - Registered new controller

2. **Frontend Files:**
   - `src/components/VirtualPrerollSection.tsx` - Updated to work with float products
   - `src/hooks/useVirtualPrerolls.ts` - Added float product API integration
   - `src/app/preroll-diagnostics/page.tsx` - Testing interface

## Next Steps

1. Deploy the modified Addify plugin
2. Enable float product on flower products
3. Train staff on the conversion process
4. Monitor conversion logs for optimization 