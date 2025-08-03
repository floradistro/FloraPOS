# Addify Pre-Roll API Integration Guide

## Overview

The Addify Multi-Location Inventory plugin already includes a complete pre-roll conversion system. You don't need to modify the plugin - just use the existing APIs.

## Available API Endpoints

### 1. Convert Flower to Pre-Rolls
```
POST /wp-json/addify/v1/preroll/convert
```

**Request Body:**
```json
{
  "product_id": 7851,
  "preroll_count": 5,
  "location_id": 32,
  "staff_id": 1,
  "notes": "Manual conversion for customer"
}
```

**What it does:**
- Deducts flower inventory (preroll_count × conversion_rate)
- Updates virtual pre-roll count
- Logs the conversion activity
- Returns success/error status

### 2. Check Virtual Pre-Roll Inventory
```
GET /wp-json/addify/v1/preroll/inventory/{product_id}
```

**Response:**
```json
{
  "product_id": 7851,
  "product_name": "Blue Dream",
  "virtual_count": 15,
  "target": 20,
  "flower_stock": 28.5,
  "conversion_rate": 0.7,
  "metrics": {
    "total_converted": 150,
    "total_sold": 135,
    "total_flower_used": 105
  }
}
```

### 3. Get Pre-Roll Activity Log
```
GET /wp-json/addify/v1/preroll/activity/{product_id}?limit=20
```

### 4. Update Pre-Roll Target
```
PUT /wp-json/addify/v1/preroll/target
```

**Request Body:**
```json
{
  "product_id": 7851,
  "target": 25
}
```

## Related Inventory APIs

### Get Location Inventory
```
POST /wp-json/wc/v3/addify_headless_inventory/inventory/bulk
```

**Request Body:**
```json
{
  "product_ids": [7851],
  "location_id": "32"
}
```

### Update Stock at Location
```
PUT /wp-json/wc/v3/addify_headless_inventory/stock/update
```

**Request Body:**
```json
{
  "inventory_id": 12345,
  "quantity": 25.5,
  "operation": "set"
}
```

## Frontend Integration

### Update the VirtualPrerollSection

The component is already built correctly. It just needs to use the Addify API endpoints:

1. **useVirtualPrerolls hook** - Already updated to use `/wp-json/addify/v1/preroll/convert`
2. **VirtualPrerollSection component** - Already displays the UI correctly

### Testing the Integration

1. Visit `/preroll-diagnostics` to test all endpoints
2. Use `/test-flower-prerolls` to see the UI in action

## Product Setup Requirements

For pre-roll conversion to work, flower products need:

1. **Product Type**: Set to "Weight" in Addify settings
2. **Conversion Rate**: Add `mli_preroll_conversion` metadata (e.g., 0.7)
3. **Multi-Inventory**: Enable in product inventory settings
4. **Location Assignment**: Assign inventory to specific locations

## How Conversion Works

1. **Check Inventory**: System checks flower stock at the specified location
2. **Calculate Need**: preroll_count × conversion_rate = flower_needed
3. **Deduct Stock**: Removes flower_needed from location inventory
4. **Update Virtual**: Increments `_virtual_preroll_count` by preroll_count
5. **Log Activity**: Records the conversion with timestamp and details

## Troubleshooting

### Common Issues

1. **404 on API Calls**
   - Ensure the pre-roll controller is loaded in the plugin
   - Check if user has `manage_woocommerce` capability

2. **Insufficient Stock Error**
   - Verify flower inventory at the location
   - Check conversion rate is set correctly

3. **No Virtual Count Update**
   - Ensure product has `_virtual_preroll_count` metadata
   - Check write permissions on product metadata

### Debug with Shell Script

```bash
chmod +x test-addify-preroll-api.sh
./test-addify-preroll-api.sh
```

This will test the conversion endpoint directly.

## Best Practices

1. **Always specify location_id** - Ensures inventory is deducted from the correct location
2. **Log staff_id** - Track who performed conversions
3. **Add descriptive notes** - Help with inventory auditing
4. **Monitor virtual counts** - Reconcile with physical pre-rolls regularly
5. **Set realistic targets** - Based on typical demand patterns

## Next Steps

1. The system is ready to use - no plugin modifications needed
2. Test with the diagnostics page first
3. Train staff on the conversion process
4. Set up regular inventory audits 