# Virtual Pre-Roll Order Fix Summary

## Issue
Virtual pre-rolls weren't being deducted when selling pre-rolls because the Addify plugin wasn't recognizing orders as pre-roll orders.

## Root Cause
The Addify plugin looks for pre-roll orders by checking the `variation` metadata on line items. It checks for:
1. `variation` metadata containing "preroll-" 
2. Falls back to `_selected_variation` if `variation` is empty

We were only sending `_selected_variation`, not `variation`.

## Solution
Updated the Cart component to include BOTH metadata keys:
- `variation`: "preroll-5" (for Addify to detect pre-roll orders)
- `_selected_variation`: "preroll-5" (as backup)

## How It Works

### 1. When Adding Pre-rolls to Cart
- Customer selects pre-roll option (e.g., 5x pre-rolls)
- Product is added with selectedVariation = "preroll-5"

### 2. During Checkout
- Cart fetches current product data to get latest virtual pre-roll count
- Adds metadata to line item:
  ```
  variation: "preroll-5"
  _selected_variation: "preroll-5"
  _preroll_count: "5"
  _grams_per_preroll: "0.7"
  _virtual_prerolls_available: "10" (if available)
  _use_virtual_prerolls: "yes" (if available)
  ```

### 3. Addify Plugin Processing
- Detects pre-roll order via `variation` containing "preroll-"
- Checks virtual pre-roll inventory 
- Uses virtual pre-rolls first, then converts flower as needed
- Updates both WooCommerce and location-specific inventory

## Testing
To verify it's working:
1. Create virtual pre-rolls for a product
2. Add that product as pre-rolls to cart
3. Complete checkout
4. Check console logs for:
   - "Virtual pre-roll check" messages
   - "MLI Virtual Pre-rolls" messages in PHP error log
5. Verify inventory deduction in admin

## Key Points
- Pre-rolls and flower are the SAME product in WooCommerce
- The "variation" is just how it's being sold (flower vs pre-rolls)
- Virtual pre-rolls are tracked in product metadata
- Addify handles the complex deduction logic automatically 