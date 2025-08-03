# Virtual Pre-Roll Inventory Deduction Fix

## ✅ Problem Solved

The issue where inventory wasn't deducting properly has been fixed. The system now updates BOTH:
1. WooCommerce main stock quantity
2. Addify location-specific inventory

## What Was Fixed

### Before
- Only updating WooCommerce product metadata
- Location inventory remained unchanged
- Stock appeared not to deduct in the UI

### After
- Updates WooCommerce stock quantity
- Updates Addify location inventory
- Both frontend and backend show correct deductions

## Test Results

Converting 5 pre-rolls (3.5g flower):
- **WooCommerce Stock**: 660g → 656g ✅
- **Location Inventory**: 60.1g → 56.6g ✅
- **Virtual Pre-Rolls**: 5 → 10 ✅

## How It Works

1. **Get Current Inventory**
   - Fetches product stock from WooCommerce
   - Gets location inventory from Addify bulk endpoint

2. **Calculate Deduction**
   - Pre-rolls × conversion rate (0.7g per pre-roll)
   - Example: 5 pre-rolls = 3.5g flower

3. **Update Both Systems**
   - WooCommerce: Updates `stock_quantity` (rounds to integer)
   - Addify: Updates location inventory via `stock/update` endpoint

4. **Track Virtual Inventory**
   - Updates `_virtual_preroll_count` metadata
   - Logs activity with timestamp

## API Flow

```javascript
// 1. Get inventory ID for product/location
POST /wp-json/wc/v3/addify_headless_inventory/inventory/bulk
{
  "product_ids": [773],
  "location_id": "30"
}

// 2. Update location inventory
POST /wp-json/wc/v3/addify_headless_inventory/stock/update
{
  "inventory_id": 6642,
  "quantity": 56.6,
  "operation": "set"
}
```

## Frontend Integration

The system automatically:
- Uses current location from `LocationContext`
- Passes location ID to conversion API
- Updates both inventory systems
- Shows real-time stock changes

## Verification

To verify it's working:
1. Note current stock in WordPress admin
2. Convert some pre-rolls in the POS
3. Check stock is reduced in:
   - WordPress admin product page
   - Addify inventory management
   - Frontend product display

The inventory deduction is now working correctly! 