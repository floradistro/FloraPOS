<?php
/**
 * Test script to debug virtual pre-roll variable initialization
 * Upload this to the WordPress root directory and run it
 */

// Load WordPress
require_once('wp-load.php');

echo "<h1>Virtual Pre-roll Variable Test</h1>";

// Test order ID from our last test
$order_id = 13580; // Update this with a recent test order ID
$order = wc_get_order($order_id);

if (!$order) {
    echo "<p>Order not found. Please update the order ID.</p>";
    exit;
}

echo "<h2>Order #$order_id Details</h2>";
echo "<p>Status: " . $order->get_status() . "</p>";
echo "<p>Created via: " . $order->get_created_via() . "</p>";

echo "<h2>Order Items:</h2>";

foreach ($order->get_items() as $item_id => $item) {
    echo "<h3>Item ID: $item_id</h3>";
    
    $product_id = $item->get_variation_id() ?: $item->get_product_id();
    echo "<p>Product ID: $product_id</p>";
    echo "<p>Product Name: " . $item->get_name() . "</p>";
    echo "<p>Quantity: " . $item->get_quantity() . "</p>";
    
    // Get all metadata
    echo "<h4>Item Metadata:</h4>";
    echo "<pre>";
    $meta_data = $item->get_meta_data();
    foreach ($meta_data as $meta) {
        echo $meta->key . " => " . print_r($meta->value, true) . "\n";
    }
    echo "</pre>";
    
    // Check specific metadata
    $variation = wc_get_order_item_meta($item_id, 'variation', true);
    $selected_variation = wc_get_order_item_meta($item_id, '_selected_variation', true);
    $preroll_count = wc_get_order_item_meta($item_id, '_preroll_count', true);
    
    echo "<h4>Variation Processing:</h4>";
    echo "<p>variation: " . ($variation ?: 'empty') . "</p>";
    echo "<p>_selected_variation: " . ($selected_variation ?: 'empty') . "</p>";
    echo "<p>_preroll_count: " . ($preroll_count ?: 'empty') . "</p>";
    
    // Test the variable initialization logic
    echo "<h4>Variable Initialization Test:</h4>";
    
    // Initialize variables like in the plugin
    $is_preroll_order = false;
    $requested_prerolls = 0;
    $preroll_conversion = 0.7;
    $quantity = $item->get_quantity();
    
    // Use selected_variation if variation is empty
    if (empty($variation) && !empty($selected_variation)) {
        $variation = $selected_variation;
        echo "<p>✓ Using _selected_variation as variation</p>";
    }
    
    // Check if it's a preroll order
    if (!empty($variation) && strpos($variation, 'preroll-') === 0) {
        $preroll_count_parsed = intval(str_replace('preroll-', '', $variation));
        $is_preroll_order = true;
        $requested_prerolls = $preroll_count_parsed;
        $quantity = $preroll_count_parsed * $preroll_conversion;
        
        echo "<p>✓ Detected as pre-roll order!</p>";
        echo "<p>  - is_preroll_order: true</p>";
        echo "<p>  - requested_prerolls: $requested_prerolls</p>";
        echo "<p>  - quantity (grams): $quantity</p>";
    } else {
        echo "<p>✗ NOT detected as pre-roll order</p>";
        echo "<p>  - variation value: '" . $variation . "'</p>";
        echo "<p>  - strpos result: " . var_export(strpos($variation, 'preroll-'), true) . "</p>";
    }
    
    // Check virtual pre-roll inventory
    echo "<h4>Virtual Pre-roll Inventory:</h4>";
    $virtual_count = get_post_meta($product_id, '_virtual_preroll_count', true);
    echo "<p>Virtual pre-rolls available: " . ($virtual_count ?: '0') . "</p>";
    
    // Test the virtual check condition
    echo "<h4>Virtual Check Condition:</h4>";
    echo "<p>!empty(\$is_preroll_order) = " . var_export(!empty($is_preroll_order), true) . "</p>";
    echo "<p>\$is_preroll_order === true = " . var_export($is_preroll_order === true, true) . "</p>";
    echo "<p>Combined condition = " . var_export(!empty($is_preroll_order) && $is_preroll_order === true, true) . "</p>";
    
    if (!empty($is_preroll_order) && $is_preroll_order === true) {
        echo "<p style='color: green;'>✓ Would enter virtual pre-roll check!</p>";
    } else {
        echo "<p style='color: red;'>✗ Would skip virtual pre-roll check!</p>";
    }
}

// Check error log location
echo "<h2>Error Log Info:</h2>";
$error_log = ini_get('error_log');
echo "<p>PHP error_log setting: " . ($error_log ?: 'not set') . "</p>";

if (defined('WP_DEBUG')) {
    echo "<p>WP_DEBUG: " . (WP_DEBUG ? 'enabled' : 'disabled') . "</p>";
}
if (defined('WP_DEBUG_LOG')) {
    echo "<p>WP_DEBUG_LOG: " . (WP_DEBUG_LOG ? 'enabled' : 'disabled') . "</p>";
}

echo "<p><small>Script completed at " . date('Y-m-d H:i:s') . "</small></p>";
?> 