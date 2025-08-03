<?php
require_once 'wp-load.php';

// Find Chilled Cherries product
$args = array(
    'post_type' => 'product',
    'posts_per_page' => -1,
    's' => 'Chilled Cherries'
);

$products = get_posts($args);

foreach ($products as $product_post) {
    $product = wc_get_product($product_post->ID);
    
    echo "Product: " . $product->get_name() . " (ID: " . $product->get_id() . ")\n";
    echo "Stock Quantity (get_stock_quantity): " . $product->get_stock_quantity() . "\n";
    echo "Stock from _stock meta: " . get_post_meta($product->get_id(), '_stock', true) . "\n";
    echo "Stock from in_stock_quantity meta: " . get_post_meta($product->get_id(), 'in_stock_quantity', true) . "\n";
    echo "\nInventory Details:\n";
    
    // Get all inventory posts for this product
    $inventory_args = array(
        'post_type' => 'af_prod_lvl_invent',
        'posts_per_page' => -1,
        'meta_query' => array(
            array(
                'key' => 'in_product',
                'value' => $product->get_id(),
                'compare' => '='
            )
        )
    );
    
    $inventories = get_posts($inventory_args);
    $total = 0;
    
    foreach ($inventories as $inventory) {
        $location_id = get_post_meta($inventory->ID, 'in_location', true);
        $location = get_term($location_id, 'af_location');
        $stock = get_post_meta($inventory->ID, 'in_stock_quantity', true);
        
        echo "- " . ($location ? $location->name : 'Unknown') . ": " . $stock . "\n";
        $total += floatval($stock);
    }
    
    echo "\nCalculated Total: " . $total . "\n";
    echo "---\n";
} 