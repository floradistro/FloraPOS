<?php
// This script recalculates the stock for a specific product

// Product ID for Chilled Cherries (you'll need to update this)
$product_id = 701; // Update this with the actual ID

// Get all inventory posts for this product
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
$total_stock = 0;

echo "Recalculating stock for product ID: $product_id\n";
echo "Found " . count($inventories) . " inventory locations\n\n";

foreach ($inventories as $inventory) {
    $location_id = get_post_meta($inventory->ID, 'in_location', true);
    $stock = get_post_meta($inventory->ID, 'in_stock_quantity', true);
    
    echo "Location ID $location_id: $stock\n";
    $total_stock += floatval($stock);
}

echo "\nTotal calculated stock: $total_stock\n";

// Update the product stock
update_post_meta($product_id, '_stock', $total_stock);
update_post_meta($product_id, 'in_stock_quantity', $total_stock);

$product = wc_get_product($product_id);
if ($product) {
    $product->set_stock_quantity($total_stock);
    $product->save();
    echo "Product stock updated successfully!\n";
}

echo "Done!\n"; 