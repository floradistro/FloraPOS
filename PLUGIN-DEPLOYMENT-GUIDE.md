# Addify Plugin Deployment Guide

## Plugin Location
The modified plugin is located at:
```
/Users/whale/Downloads/PluginsV12/addify.modified/
```

## Files to Deploy

### 1. Main Plugin File
```
Source: /Users/whale/Downloads/PluginsV12/addify.modified/class-addify-multi-inventory-management.php
Target: wp-content/plugins/addify-multi-inventory-management/class-addify-multi-inventory-management.php
```

### 2. Admin Inventory Handler
```
Source: /Users/whale/Downloads/PluginsV12/addify.modified/includes/admin/class-addify-multi-location-inventory-admin.php
Target: wp-content/plugins/addify-multi-inventory-management/includes/admin/class-addify-multi-location-inventory-admin.php
```

## What Was Added

### In Main Plugin File:
- `af_mli_get_virtual_product_source()` - Detects virtual products
- `af_mli_handle_virtual_product_deduction()` - Handles inventory deduction
- `af_mli_filter_virtual_stock_status()` - Filters stock status
- `af_mli_filter_virtual_stock_quantity()` - Filters stock quantity
- `af_mli_handle_virtual_product_refund()` - Handles refunds

### In Admin File:
- Modified inventory deduction logic to detect and handle virtual products
- Added support for switching to source flower when virtual product is sold
- Added order metadata tracking for virtual product deductions

## Deployment Steps

1. **Backup Current Plugin**
   ```bash
   cp -r wp-content/plugins/addify-multi-inventory-management wp-content/plugins/addify-multi-inventory-management.backup
   ```

2. **Copy Modified Files**
   ```bash
   cp /Users/whale/Downloads/PluginsV12/addify.modified/class-addify-multi-inventory-management.php wp-content/plugins/addify-multi-inventory-management/
   cp /Users/whale/Downloads/PluginsV12/addify.modified/includes/admin/class-addify-multi-location-inventory-admin.php wp-content/plugins/addify-multi-inventory-management/includes/admin/
   ```

3. **Clear Cache**
   - Clear WordPress object cache
   - Clear any CDN/page caches

4. **Test**
   - Create a test virtual product
   - Place a test order
   - Verify inventory deduction
   - Test refund

## Rollback (if needed)
```bash
cp -r wp-content/plugins/addify-multi-inventory-management.backup/* wp-content/plugins/addify-multi-inventory-management/
```

## Key Documentation Files
- `ADDIFY-VIRTUAL-PRODUCT-MODIFICATIONS.md` - Technical details
- `VIRTUAL-PREROLL-COMPLETE-IMPLEMENTATION.md` - Full implementation guide
- `VIRTUAL-PREROLL-WORKFLOW.md` - Staff workflow guide 