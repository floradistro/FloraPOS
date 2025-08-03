# Virtual Pre-Rolls Feature Test Results

## Test Date: August 2, 2025

## Executive Summary

The virtual pre-rolls feature in the addify.modified plugin has been tested comprehensively. The system successfully creates pre-roll orders with proper metadata and decimal quantity tracking, but there are issues with inventory deduction that need to be addressed.

## Test Results

### ✅ Working Features

1. **Pre-Roll Order Creation**
   - Orders are created successfully with pre-roll variations
   - Pre-roll metadata is properly attached to line items
   - Decimal quantities are calculated correctly

2. **Metadata Tracking**
   - `_preroll_count`: Number of pre-rolls ordered
   - `_grams_per_preroll`: Conversion rate (0.7g per pre-roll)
   - `af_mli_decimal_qty`: Correct decimal quantity in grams
   - `_decimal_quantity`: Also tracks the decimal amount

3. **Pricing Structure**
   - Pre-roll pricing tiers are configured:
     - 1 pre-roll: $11.99
     - 3 pre-rolls: $29.99
     - 5 pre-rolls: $39.99
     - 10 pre-rolls: $69.99

4. **Multi-Location Support**
   - Products have multi-location inventory configured
   - Each location has its own stock tracking metadata

### ⚠️ Issues Found

1. **Stock Deduction Problem**
   - Only 1g is deducted regardless of actual quantity
   - Expected vs Actual deductions:
     - 1 pre-roll: Expected 0.7g, Actual 1g
     - 3 pre-rolls: Expected 2.1g, Actual 1g
     - 5 pre-rolls: Expected 3.5g, Actual 1g
     - 10 pre-rolls: Expected 7g, Actual 1g
   - This suggests the plugin is rounding down decimal quantities to 1

2. **Virtual Pre-Roll API Endpoints**
   - `/wp-json/addify/v1/preroll/*` endpoints return 401 Unauthorized
   - May require different authentication or may not be exposed via REST API

## Test Details

### Products Tested
- Pink Runtz (ID: 773)
- Pressure Pack Runtz (ID: 779)
- Chanel Candy (ID: 786)
- Chilled Cherries (ID: 792)

### Test Scenarios
1. Created orders with 1, 3, 5, and 10 pre-rolls
2. Verified metadata attachment
3. Checked inventory deduction
4. Tested multi-location inventory display
5. Attempted to access virtual pre-roll API endpoints

## Code Examples

### Creating a Pre-Roll Order
```json
{
  "line_items": [{
    "product_id": 773,
    "quantity": 1,
    "meta_data": [
      {"key": "_selected_variation", "value": "preroll-5"},
      {"key": "_variation_type", "value": "preroll_grams"},
      {"key": "_preroll_count", "value": "5"},
      {"key": "_grams_per_preroll", "value": "0.7"},
      {"key": "_quantity_is_grams", "value": "yes"}
    ]
  }]
}
```

### Order Response Metadata
```json
{
  "_preroll_count": "5",
  "_grams_per_preroll": "0.7",
  "_decimal_quantity": "3.5",
  "af_mli_decimal_qty": "3.5"
}
```

## Recommendations

1. **Fix Stock Deduction**
   - The plugin needs to be updated to properly handle decimal stock deductions
   - Currently only deducting 1g regardless of actual decimal quantity

2. **Virtual Pre-Roll Management**
   - If virtual pre-roll creation is a feature, the API endpoints need to be properly exposed
   - Documentation needed for virtual pre-roll conversion process

3. **Testing Environment**
   - Consider setting up a dedicated test environment to avoid affecting live inventory

## Test Scripts

Two test scripts were created:
1. `test-virtual-prerolls.sh` - Basic pre-roll order test
2. `test-virtual-prerolls-comprehensive.sh` - Comprehensive testing suite

Both scripts are available in the project root for future testing.

## Conclusion

The virtual pre-rolls feature is partially functional. Orders are created correctly with proper metadata, but the inventory deduction mechanism needs to be fixed to handle decimal quantities properly. The virtual pre-roll conversion feature (if it exists) requires further investigation and proper API exposure. 