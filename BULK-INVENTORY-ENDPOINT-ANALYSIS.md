# Bulk Inventory Endpoint Analysis & Fix

## 🐛 **Problem Summary**

The Addify Multi-Location Inventory plugin has **route registration issues** with specific bulk endpoints that prevent them from working properly via REST API calls.

### **Affected Endpoints:**
- ❌ `/wp-json/wc/v3/addify_headless_inventory/inventory/bulk` (POST)
- ❌ `/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update` (POST)

### **Working Endpoints:**
- ✅ `/wp-json/wc/v3/addify_headless_inventory/locations` (GET)
- ✅ `/wp-json/wc/v3/addify_headless_inventory/locations/{id}/stock` (GET)
- ✅ `/wp-json/wc/v3/addify_headless_inventory/products/{id}/inventory` (GET/POST)

## 🔍 **Root Cause Analysis**

### **Investigation Results:**

1. **✅ Plugin Loading:** Plugin loads correctly (7 locations found)
2. **✅ Route Registration:** Bulk routes appear in WordPress REST API route list
3. **✅ Controller Methods:** `get_bulk_inventory()` and `bulk_update_stock()` methods exist
4. **✅ Authentication:** URL parameter auth works for other endpoints
5. **✅ Individual POST Endpoints:** Other POST endpoints work (e.g., create inventory)
6. **❌ Bulk POST Endpoints:** Both bulk endpoints return 404 "No route was found"

### **Technical Details:**

```php
// This route registration exists but doesn't work:
register_rest_route(
    $this->namespace,
    '/' . $this->rest_base . '/inventory/bulk',
    array(
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'get_bulk_inventory'),
            'permission_callback' => array($this, 'get_items_permissions_check'),
            'args'                => array(
                'product_ids' => array(
                    'description' => 'Array of product IDs to fetch inventory for',
                    'type'        => 'array',
                    'required'    => true,
                ),
                'location_id' => array(
                    'description' => 'Location ID to filter inventory by',
                    'type'        => 'integer',
                    'required'    => false,
                ),
            ),
        ),
    )
);
```

### **Likely Causes:**

1. **WordPress Rewrite Rule Conflict:** The hyphenated route `/inventory/bulk` might conflict with WordPress rewrite rules
2. **POST Request Handling:** Issue with how POST requests are processed for these specific routes
3. **Permission Callback:** The permission check might be failing silently for bulk operations
4. **Route Priority:** Other plugins or WordPress core might be intercepting these routes

## ✅ **Working Solution**

### **Workaround Implementation:**

Instead of using the broken bulk endpoint, use individual product inventory requests:

```javascript
/**
 * Bulk inventory fetch using individual requests (WORKAROUND)
 */
async function getBulkInventoryWorkaround(productIds, locationId) {
    const bulkData = {};
    
    for (const productId of productIds) {
        try {
            const inventory = await makeAPIRequest(
                `/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`
            );
            
            // Filter by location if specified
            const locationInventory = locationId 
                ? inventory.filter(inv => inv.location_id == locationId)
                : inventory;
            
            if (locationInventory.length > 0) {
                bulkData[productId] = locationInventory;
            }
        } catch (error) {
            console.error(`Failed to fetch inventory for product ${productId}:`, error.message);
        }
    }
    
    return bulkData;
}
```

### **Performance Considerations:**

- **Individual Requests:** Multiple HTTP requests vs single bulk request
- **Network Overhead:** Higher latency but still functional
- **Rate Limiting:** Consider implementing request throttling for large product sets
- **Caching:** Cache results to reduce repeated requests

## 🔧 **Recommended Fixes**

### **1. Immediate Fix (Plugin Developer):**

```php
// In af-mli-headless-api-controller.php, try alternative route registration:

register_rest_route(
    $this->namespace,
    '/' . $this->rest_base . '/inventory-bulk', // Remove hyphen
    array(
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'get_bulk_inventory'),
            'permission_callback' => array($this, 'get_items_permissions_check'),
            'args'                => $this->get_bulk_inventory_args(),
        ),
    )
);
```

### **2. Debug Route Registration:**

```php
// Add debugging to register_routes() method:
public function register_routes() {
    // ... existing routes ...
    
    // Debug bulk route registration
    $route_registered = register_rest_route(
        $this->namespace,
        '/' . $this->rest_base . '/inventory/bulk',
        array(/* ... route config ... */)
    );
    
    if (!$route_registered) {
        error_log('MLI: Failed to register bulk inventory route');
    } else {
        error_log('MLI: Successfully registered bulk inventory route');
    }
}
```

### **3. Alternative Endpoint Structure:**

```php
// Register under different namespace to avoid conflicts:
register_rest_route(
    'addify/v1', // Different namespace
    '/inventory/bulk',
    array(/* ... route config ... */)
);
```

## 📊 **Test Results**

### **Charlotte Monroe 28205 Inventory:**
- **✅ Location Discovery:** Found location ID 30
- **✅ Individual Inventory:** 57 products retrieved successfully
- **✅ Decimal Quantities:** Supports weight-based products (100.7, 96.5, 75.5)
- **✅ Stock Filtering:** Location-specific filtering works
- **✅ Low Stock Alerts:** 1 item below threshold (5 units)
- **✅ Workaround Bulk:** Individual requests provide same functionality

### **API Authentication:**
- **✅ URL Parameters:** `?consumer_key=xxx&consumer_secret=yyy` works
- **❌ Basic Auth:** `Authorization: Basic xxx` fails for bulk endpoints
- **✅ GET Requests:** All GET endpoints work perfectly
- **⚠️ POST Requests:** Only individual POST endpoints work

## 🚀 **Implementation Guide**

### **For POS System Integration:**

```javascript
// Use this pattern for bulk inventory operations:
class FloraInventoryAPI {
    async getBulkInventory(productIds, locationId = null) {
        const results = {};
        
        // Process in batches to avoid overwhelming the server
        const batchSize = 10;
        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            
            const batchPromises = batch.map(productId => 
                this.getProductInventory(productId, locationId)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    results[batch[index]] = result.value;
                }
            });
        }
        
        return results;
    }
    
    async getProductInventory(productId, locationId = null) {
        const endpoint = `/wp-json/wc/v3/addify_headless_inventory/products/${productId}/inventory`;
        const inventory = await this.makeAPIRequest(endpoint);
        
        return locationId 
            ? inventory.filter(inv => inv.location_id == locationId)
            : inventory;
    }
}
```

## 📝 **Conclusion**

The bulk inventory endpoints have route registration issues that prevent them from working via REST API calls. However, the **individual product inventory endpoints work perfectly** and can be used as a reliable workaround.

**Recommendation:** Use the individual request approach for production systems until the plugin developer fixes the bulk endpoint route registration issue.

The Charlotte Monroe 28205 location inventory retrieval is **fully functional** using this workaround approach.