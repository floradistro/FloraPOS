# Addify Plugin Virtual Pre-Roll Fix

## The Problem
Virtual pre-rolls are not being used for API/POS orders even though:
1. The metadata is correctly sent (`variation: "preroll-5"`)
2. Virtual pre-rolls are available on the product
3. The virtual pre-roll logic exists in the plugin

## Root Cause
The `af_mli_shop_order` function only runs for admin orders via `woocommerce_process_shop_order_meta` hook. It doesn't run for API/POS orders.

## Complete Fix Required

### 1. In `/includes/admin/class-addify-multi-location-inventory-admin.php`

Add these hooks at the top (around line 23):
```php
// Also hook for API/POS orders
add_action('woocommerce_new_order', 'af_mli_shop_order_for_api', 20, 2);
add_action('woocommerce_order_status_changed', 'af_mli_shop_order_status_changed', 10, 4);

/**
 * Handle inventory for API/POS orders when they're created
 */
function af_mli_shop_order_for_api($order_id, $order = null) {
    if (!$order) {
        $order = wc_get_order($order_id);
    }
    
    if (!$order) {
        return;
    }
    
    // Only process API/POS orders
    $created_via = $order->get_created_via();
    if ($created_via === 'pos' || $created_via === 'rest-api' || strpos($created_via, 'rest') !== false) {
        // Only process if order is in processing/completed status
        $status = $order->get_status();
        if (in_array($status, ['processing', 'completed'])) {
            error_log("MLI: Processing API order {$order_id} with status {$status}");
            af_mli_shop_order($order_id);
        }
    }
}

/**
 * Handle inventory when order status changes to processing/completed
 */
function af_mli_shop_order_status_changed($order_id, $old_status, $new_status, $order) {
    // Process inventory when order moves to processing/completed
    if (!in_array($old_status, ['processing', 'completed']) && in_array($new_status, ['processing', 'completed'])) {
        $created_via = $order->get_created_via();
        if ($created_via === 'pos' || $created_via === 'rest-api' || strpos($created_via, 'rest') !== false) {
            error_log("MLI: Order {$order_id} status changed from {$old_status} to {$new_status}, processing inventory");
            af_mli_shop_order($order_id);
        }
    }
}
```

### 2. Modify the `af_mli_shop_order` function (around line 660)

Change the nonce verification to allow API orders:
```php
function af_mli_shop_order( $order_id ) {
    $order = wc_get_order($order_id);
    
    // Check if this is an API/POS order
    $created_via = $order->get_created_via();
    $is_api_order = ($created_via === 'pos' || $created_via === 'rest-api' || strpos($created_via, 'rest') !== false);
    
    // Skip nonce check for API orders
    if (!$is_api_order) {
        $nonce = isset($_POST['order_detail_nonce_field']) ? sanitize_text_field(wp_unslash($_POST['order_detail_nonce_field'])) : wp_create_nonce('order_detail_nonce');
        
        if (!is_ajax()) {
            if ('yes' == get_option('mli_gen_backend_mode_only') && !wp_verify_nonce($nonce, 'order_detail_nonce')) {
                wp_die('Failed Security Check');
            }
            if (!wp_verify_nonce($nonce, 'order_detail_nonce')) {
                wp_die('Failed Security Check');
            }
        }
    }
    
    // Rest of the function remains the same...
```

### 3. Remove duplicate code in `class-addify-multi-inventory-management.php`

The `af_handle_api_order_creation` function tries to call `custom_order_status_changed` but this creates a duplicate process. With our new hooks, this is no longer needed.

## Testing After Fix

1. Upload the modified plugin
2. Create virtual pre-rolls for a product
3. Create a POS order for that product as pre-rolls
4. Check that virtual pre-rolls are deducted first

## Expected Behavior

When ordering 5 pre-rolls with 5 virtual available:
- Virtual pre-roll count: 5 → 0  
- Flower stock: No change

When ordering 10 pre-rolls with 5 virtual available:
- Virtual pre-roll count: 5 → 0
- Flower stock: Deduct 3.5g (5 pre-rolls × 0.7g) 