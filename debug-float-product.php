<?php
/**
 * Debug script for float product creation
 * 
 * Place this in your WordPress root and run it to test the float product creation
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied');
}

// Product ID to test with
$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 7851;

echo "<h1>Float Product Debug</h1>";
echo "<p>Testing product ID: {$product_id}</p>";

// Get product
$product = wc_get_product($product_id);
if (!$product) {
    die("Product not found");
}

echo "<h2>Product Info:</h2>";
echo "<ul>";
echo "<li>Name: " . $product->get_name() . "</li>";
echo "<li>SKU: " . $product->get_sku() . "</li>";
echo "<li>Type: " . $product->get_type() . "</li>";
echo "<li>Stock: " . $product->get_stock_quantity() . "</li>";
echo "</ul>";

// Check current metadata
echo "<h2>Current Metadata:</h2>";
echo "<ul>";
echo "<li>mli_product_type: " . get_post_meta($product_id, 'mli_product_type', true) . "</li>";
echo "<li>mli_is_float_product: " . get_post_meta($product_id, 'mli_is_float_product', true) . "</li>";
echo "<li>mli_preroll_conversion: " . get_post_meta($product_id, 'mli_preroll_conversion', true) . "</li>";
echo "<li>_linked_preroll_product_id: " . get_post_meta($product_id, '_linked_preroll_product_id', true) . "</li>";
echo "</ul>";

// Test float product creation
if (isset($_GET['create'])) {
    echo "<h2>Creating Float Product...</h2>";
    
    // Set metadata
    update_post_meta($product_id, 'mli_product_type', 'weight');
    update_post_meta($product_id, 'mli_is_float_product', 'yes');
    update_post_meta($product_id, 'mli_preroll_conversion', '0.7');
    
    // Include the class
    require_once(AFMLI_PLUGIN_DIR . 'includes/admin/product/class-addify-mli-product.php');
    
    // Create instance and run
    $mli_product = new Addify_Mli_Product();
    
    try {
        $mli_product->create_or_update_preroll_product($product_id, $product, 0.7);
        echo "<p style='color: green;'>✓ Float product creation completed</p>";
        
        // Check if pre-roll was created
        $preroll_id = get_post_meta($product_id, '_linked_preroll_product_id', true);
        if ($preroll_id) {
            echo "<p>Pre-roll product created with ID: {$preroll_id}</p>";
            $preroll = wc_get_product($preroll_id);
            if ($preroll) {
                echo "<ul>";
                echo "<li>Pre-roll Name: " . $preroll->get_name() . "</li>";
                echo "<li>Pre-roll SKU: " . $preroll->get_sku() . "</li>";
                echo "<li>Pre-roll Price: $" . $preroll->get_price() . "</li>";
                echo "</ul>";
            }
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Error: " . $e->getMessage() . "</p>";
    }
    
    // Check error log
    if (function_exists('error_get_last')) {
        $error = error_get_last();
        if ($error && $error['type'] === E_ERROR) {
            echo "<p style='color: red;'>Fatal Error: " . $error['message'] . "</p>";
        }
    }
} else {
    echo "<p><a href='?product_id={$product_id}&create=1' class='button'>Create Float Product</a></p>";
}

// Show all inventories
echo "<h2>Product Inventories:</h2>";
$inventories = get_posts(array(
    'post_type'   => 'af_prod_lvl_invent',
    'post_status' => 'publish',
    'numberposts' => -1,
    'post_parent' => $product_id,
));

if ($inventories) {
    echo "<ul>";
    foreach ($inventories as $inventory) {
        $location_id = get_post_meta($inventory->ID, 'in_location', true);
        $stock = get_post_meta($inventory->ID, 'in_stock_quantity', true);
        echo "<li>Location ID {$location_id}: {$stock} units</li>";
    }
    echo "</ul>";
} else {
    echo "<p>No inventories found</p>";
}

// Show pre-roll product if exists
$preroll_id = get_post_meta($product_id, '_linked_preroll_product_id', true);
if ($preroll_id) {
    echo "<h2>Linked Pre-roll Product:</h2>";
    $preroll_inventories = get_posts(array(
        'post_type'   => 'af_prod_lvl_invent',
        'post_status' => 'publish',
        'numberposts' => -1,
        'post_parent' => $preroll_id,
    ));
    
    if ($preroll_inventories) {
        echo "<ul>";
        foreach ($preroll_inventories as $inventory) {
            $location_id = get_post_meta($inventory->ID, 'in_location', true);
            $stock = get_post_meta($inventory->ID, 'in_stock_quantity', true);
            $virtual = get_post_meta($inventory->ID, '_virtual_preroll_count', true);
            echo "<li>Location ID {$location_id}: {$stock} stock, {$virtual} virtual</li>";
        }
        echo "</ul>";
    }
}

echo "<hr>";
echo "<p><a href='debug-float-product.php'>Reset</a></p>";
?> 