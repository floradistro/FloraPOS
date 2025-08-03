<?php
/**
 * Test the fixed float product functionality
 * 
 * This script tests the float product creation without creating duplicates
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied');
}

echo "<h1>Float Product Test (Safe Version)</h1>";

// Product ID to test with
$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;

if (!$product_id) {
    echo "<form method='get'>";
    echo "<p>Enter a flower product ID to test: ";
    echo "<input type='number' name='product_id' required>";
    echo "<input type='submit' value='Test'>";
    echo "</p>";
    echo "</form>";
    die();
}

// Get product
$product = wc_get_product($product_id);
if (!$product) {
    die("Product not found");
}

echo "<h2>Testing Product:</h2>";
echo "<ul>";
echo "<li>ID: {$product_id}</li>";
echo "<li>Name: " . $product->get_name() . "</li>";
echo "<li>SKU: " . $product->get_sku() . "</li>";
echo "<li>Categories: " . implode(', ', wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names'))) . "</li>";
echo "</ul>";

// Check current metadata
echo "<h2>Current Status:</h2>";
echo "<ul>";
$is_float = get_post_meta($product_id, 'mli_is_float_product', true);
$product_type = get_post_meta($product_id, 'mli_product_type', true);
$conversion_rate = get_post_meta($product_id, 'mli_preroll_conversion', true);
$linked_preroll = get_post_meta($product_id, '_linked_preroll_product_id', true);
$pending_flag = get_post_meta($product_id, '_float_product_pending', true);

echo "<li>Product Type: {$product_type}</li>";
echo "<li>Is Float Product: {$is_float}</li>";
echo "<li>Conversion Rate: {$conversion_rate}</li>";
echo "<li>Linked Pre-roll ID: {$linked_preroll}</li>";
echo "<li>Pending Flag: {$pending_flag}</li>";
echo "</ul>";

// Check if pre-roll already exists
if ($linked_preroll) {
    $preroll = wc_get_product($linked_preroll);
    if ($preroll) {
        echo "<h2>Linked Pre-roll Product:</h2>";
        echo "<ul>";
        echo "<li>ID: {$linked_preroll}</li>";
        echo "<li>Name: " . $preroll->get_name() . "</li>";
        echo "<li>SKU: " . $preroll->get_sku() . "</li>";
        echo "<li>Categories: " . implode(', ', wp_get_post_terms($linked_preroll, 'product_cat', array('fields' => 'names'))) . "</li>";
        echo "</ul>";
    }
}

// Test enabling float product
if (isset($_GET['enable'])) {
    echo "<h2>Enabling Float Product...</h2>";
    
    // First, ensure it's a weight-based product
    update_post_meta($product_id, 'mli_product_type', 'weight');
    update_post_meta($product_id, 'mli_preroll_conversion', '0.7');
    
    // Simulate the save process
    $old_status = get_post_meta($product_id, 'mli_is_float_product', true);
    update_post_meta($product_id, 'mli_is_float_product', 'yes');
    
    // Only set pending if status changed and no pre-roll exists
    if ($old_status !== 'yes' && !$linked_preroll) {
        update_post_meta($product_id, '_float_product_pending', 'yes');
        echo "<p>✓ Set pending flag</p>";
        
        // Trigger the creation
        require_once(AFMLI_PLUGIN_DIR . 'includes/admin/product/class-addify-mli-product.php');
        $mli_product = new Addify_Mli_Product();
        $mli_product->handle_float_product_creation($product_id);
        
        echo "<p>✓ Triggered float product creation</p>";
    } else {
        echo "<p>Float product already enabled or pre-roll exists</p>";
    }
    
    // Check results
    $new_preroll_id = get_post_meta($product_id, '_linked_preroll_product_id', true);
    if ($new_preroll_id && !$linked_preroll) {
        echo "<p style='color: green;'>✓ Pre-roll created with ID: {$new_preroll_id}</p>";
    }
}

// Check for duplicate pre-rolls
echo "<h2>Checking for Duplicates:</h2>";
global $wpdb;
$clean_name = trim(str_replace('Pre-rolls', '', $product->get_name()));
$clean_name = trim(str_replace('Pre-roll', '', $clean_name));

$duplicates = $wpdb->get_results($wpdb->prepare("
    SELECT ID, post_title, post_status 
    FROM {$wpdb->posts} 
    WHERE post_type = 'product' 
    AND post_title LIKE %s
    AND ID != %d
", '%' . $clean_name . '%Pre-roll%', $linked_preroll ?: 0));

if ($duplicates) {
    echo "<p style='color: red;'>Found " . count($duplicates) . " potential duplicate pre-roll products:</p>";
    echo "<ul>";
    foreach ($duplicates as $dup) {
        echo "<li>ID: {$dup->ID} - {$dup->post_title} (Status: {$dup->post_status})</li>";
    }
    echo "</ul>";
} else {
    echo "<p style='color: green;'>✓ No duplicate pre-roll products found</p>";
}

// Actions
echo "<hr>";
if (!$linked_preroll && $is_float !== 'yes') {
    echo "<p><a href='?product_id={$product_id}&enable=1' class='button'>Enable Float Product</a></p>";
} elseif ($is_float === 'yes' && !$linked_preroll) {
    echo "<p><a href='?product_id={$product_id}&enable=1' class='button'>Retry Pre-roll Creation</a></p>";
}

echo "<p><a href='test-float-product-safe.php'>Test Another Product</a></p>";
echo "<p><a href='cleanup-duplicate-prerolls.php'>Go to Cleanup Tool</a></p>";
?> 