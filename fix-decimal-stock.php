<?php
/**
 * This script fixes decimal stock values by recalculating from inventory locations
 * and updating the database directly
 */

// Load WordPress
require_once('wp-load.php');

echo "Fixing decimal stock values...\n\n";

// Get all products with manage stock enabled
$args = array(
    'post_type' => 'product',
    'posts_per_page' => -1,
    'meta_query' => array(
        array(
            'key' => '_manage_stock',
            'value' => 'yes',
            'compare' => '='
        )
    )
);

$products = get_posts($args);

echo "Found " . count($products) . " products with stock management enabled.\n\n";

foreach ($products as $product_post) {
    $product_id = $product_post->ID;
    $product_name = $product_post->post_title;
    
    // Get all inventory locations for this product
    $inventory_args = array(
        'post_type' => 'af_prod_lvl_invent',
        'posts_per_page' => -1,
        'meta_query' => array(
            array(
                'key' => 'in_product',
                'value' => $product_id,
                'compare' => '='
            )
        )
    );
    
    $inventories = get_posts($inventory_args);
    
    if (empty($inventories)) {
        continue;
    }
    
    $total_stock = 0;
    $location_details = array();
    
    foreach ($inventories as $inventory) {
        $location_id = get_post_meta($inventory->ID, 'in_location', true);
        $location = get_term($location_id, 'af_location');
        $stock = get_post_meta($inventory->ID, 'in_stock_quantity', true);
        $stock_float = floatval($stock);
        
        $total_stock += $stock_float;
        
        if ($location) {
            $location_details[] = $location->name . ": " . $stock_float;
        }
    }
    
    // Get current stock value
    $current_stock = get_post_meta($product_id, '_stock', true);
    
    // Only update if there's a difference
    if (abs(floatval($current_stock) - $total_stock) > 0.01) {
        echo "Product: $product_name (ID: $product_id)\n";
        echo "Current stock: $current_stock\n";
        echo "Calculated stock: $total_stock\n";
        echo "Locations: " . implode(", ", $location_details) . "\n";
        
        // Update the stock value directly in the database
        global $wpdb;
        
        // Update postmeta directly to preserve decimal
        $wpdb->update(
            $wpdb->postmeta,
            array('meta_value' => $total_stock),
            array(
                'post_id' => $product_id,
                'meta_key' => '_stock'
            ),
            array('%s'),
            array('%d', '%s')
        );
        
        // Also update the custom meta
        update_post_meta($product_id, 'in_stock_quantity', $total_stock);
        
        // Clear any caches
        wp_cache_delete($product_id, 'post_meta');
        
        echo "Updated!\n\n";
    }
}

echo "Done! Stock values have been fixed.\n";
echo "You may need to clear your browser cache and refresh the products page.\n"; 