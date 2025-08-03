<?php
/**
 * Addify Multi-Location Inventory Modification for Virtual Pre-roll Products
 * 
 * This shows the key modifications needed to handle virtual pre-roll products
 * that are linked to flower inventory.
 */

// Add this to class-addify-multi-location-inventory-admin.php

/**
 * Check if a product is a virtual pre-roll and get its source flower ID
 */
function af_mli_get_virtual_product_source($product_id) {
    $is_virtual = get_post_meta($product_id, '_virtual_product', true);
    if ($is_virtual === 'yes') {
        return array(
            'source_flower_id' => get_post_meta($product_id, '_source_flower_id', true),
            'conversion_rate' => floatval(get_post_meta($product_id, '_conversion_rate', true)) ?: 0.7,
            'product_type' => get_post_meta($product_id, '_product_type', true)
        );
    }
    return false;
}

/**
 * Modified inventory deduction for virtual products
 */
function af_mli_deduct_inventory_for_virtual_product($order_item_id, $product_id, $quantity, $location_id) {
    // Check if this is a virtual pre-roll product
    $virtual_info = af_mli_get_virtual_product_source($product_id);
    
    if ($virtual_info && $virtual_info['product_type'] === 'preroll') {
        $source_flower_id = $virtual_info['source_flower_id'];
        $conversion_rate = $virtual_info['conversion_rate'];
        
        // Calculate how much flower is needed
        $grams_needed = $quantity * $conversion_rate;
        
        // Check virtual pre-roll inventory first
        $virtual_available = intval(get_post_meta($source_flower_id, '_virtual_preroll_count', true));
        $virtual_used = 0;
        $flower_to_deduct = $grams_needed;
        
        if ($virtual_available > 0) {
            // Use virtual inventory first
            $virtual_used = min($quantity, $virtual_available);
            $remaining_needed = $quantity - $virtual_used;
            $flower_to_deduct = $remaining_needed * $conversion_rate;
            
            // Update virtual count
            $new_virtual_count = $virtual_available - $virtual_used;
            update_post_meta($source_flower_id, '_virtual_preroll_count', $new_virtual_count);
            
            error_log("Virtual Pre-rolls: Used {$virtual_used} from virtual inventory, {$remaining_needed} to make fresh");
        }
        
        // Deduct from flower inventory
        if ($flower_to_deduct > 0) {
            // Get current flower inventory for location
            $inventory_id = af_mli_get_inventory_post_id($source_flower_id, $location_id);
            
            if ($inventory_id) {
                $current_stock = floatval(get_post_meta($inventory_id, 'in_stock_quantity', true));
                $new_stock = $current_stock - $flower_to_deduct;
                
                // Update inventory
                update_post_meta($inventory_id, 'in_stock_quantity', $new_stock);
                
                // Update WooCommerce stock
                af_mli_update_woo_stock($source_flower_id);
                
                error_log("Virtual Pre-rolls: Deducted {$flower_to_deduct}g from flower inventory at location {$location_id}");
            }
        }
        
        // Add metadata to order item
        wc_add_order_item_meta($order_item_id, '_virtual_product_deduction', array(
            'source_flower_id' => $source_flower_id,
            'virtual_used' => $virtual_used,
            'flower_deducted' => $flower_to_deduct,
            'total_prerolls' => $quantity,
            'location_id' => $location_id
        ));
        
        // Log activity
        af_mli_log_preroll_activity($source_flower_id, 'virtual_sale', array(
            'order_item_id' => $order_item_id,
            'quantity_sold' => $quantity,
            'virtual_used' => $virtual_used,
            'flower_converted' => $flower_to_deduct,
            'location_id' => $location_id
        ));
        
        return true; // Handled
    }
    
    return false; // Not a virtual product
}

/**
 * Hook into the existing inventory deduction process
 */
add_filter('af_mli_before_inventory_deduction', function($continue, $order_item_id, $product_id, $quantity, $location_id) {
    // Try to handle as virtual product first
    if (af_mli_deduct_inventory_for_virtual_product($order_item_id, $product_id, $quantity, $location_id)) {
        return false; // Stop normal deduction process
    }
    return $continue; // Continue with normal deduction
}, 10, 5);

/**
 * Calculate available stock for virtual products
 */
function af_mli_get_virtual_product_availability($product_id, $location_id = null) {
    $virtual_info = af_mli_get_virtual_product_source($product_id);
    
    if ($virtual_info && $virtual_info['product_type'] === 'preroll') {
        $source_flower_id = $virtual_info['source_flower_id'];
        $conversion_rate = $virtual_info['conversion_rate'];
        
        // Get flower stock
        if ($location_id) {
            $inventory_id = af_mli_get_inventory_post_id($source_flower_id, $location_id);
            $flower_stock = floatval(get_post_meta($inventory_id, 'in_stock_quantity', true));
        } else {
            // Get total stock across all locations
            $flower_stock = af_mli_get_total_stock($source_flower_id);
        }
        
        // Get virtual pre-rolls ready
        $virtual_ready = intval(get_post_meta($source_flower_id, '_virtual_preroll_count', true));
        
        // Calculate total available
        $can_make = floor($flower_stock / $conversion_rate);
        $total_available = $virtual_ready + $can_make;
        
        return array(
            'total_available' => $total_available,
            'virtual_ready' => $virtual_ready,
            'can_make' => $can_make,
            'flower_stock' => $flower_stock,
            'in_stock' => $total_available > 0
        );
    }
    
    return false;
}

/**
 * Filter WooCommerce stock status for virtual products
 */
add_filter('woocommerce_product_get_stock_status', function($status, $product) {
    $availability = af_mli_get_virtual_product_availability($product->get_id());
    
    if ($availability) {
        return $availability['in_stock'] ? 'instock' : 'outofstock';
    }
    
    return $status;
}, 10, 2);

/**
 * Filter WooCommerce stock quantity display for virtual products
 */
add_filter('woocommerce_product_get_stock_quantity', function($stock, $product) {
    $availability = af_mli_get_virtual_product_availability($product->get_id());
    
    if ($availability) {
        return $availability['total_available'];
    }
    
    return $stock;
}, 10, 2);

/**
 * Add virtual product info to REST API response
 */
add_filter('woocommerce_rest_prepare_product_object', function($response, $product, $request) {
    $virtual_info = af_mli_get_virtual_product_source($product->get_id());
    
    if ($virtual_info) {
        $availability = af_mli_get_virtual_product_availability($product->get_id());
        
        $response->data['virtual_product_info'] = array(
            'is_virtual_product' => true,
            'source_flower_id' => $virtual_info['source_flower_id'],
            'conversion_rate' => $virtual_info['conversion_rate'],
            'product_type' => $virtual_info['product_type'],
            'availability' => $availability
        );
    }
    
    return $response;
}, 10, 3);

/**
 * Handle refunds for virtual products
 */
add_action('woocommerce_order_item_refunded', function($order_id, $item_id, $refunded_qty) {
    $order_item = WC_Order_Factory::get_order_item($item_id);
    if (!$order_item) return;
    
    $product_id = $order_item->get_product_id();
    $virtual_deduction = wc_get_order_item_meta($item_id, '_virtual_product_deduction', true);
    
    if ($virtual_deduction) {
        // Calculate proportional refund
        $original_qty = $order_item->get_quantity();
        $refund_ratio = $refunded_qty / $original_qty;
        
        $flower_to_restore = $virtual_deduction['flower_deducted'] * $refund_ratio;
        $virtual_to_restore = round($virtual_deduction['virtual_used'] * $refund_ratio);
        
        // Restore flower inventory
        if ($flower_to_restore > 0) {
            $inventory_id = af_mli_get_inventory_post_id(
                $virtual_deduction['source_flower_id'], 
                $virtual_deduction['location_id']
            );
            
            if ($inventory_id) {
                $current_stock = floatval(get_post_meta($inventory_id, 'in_stock_quantity', true));
                update_post_meta($inventory_id, 'in_stock_quantity', $current_stock + $flower_to_restore);
            }
        }
        
        // Restore virtual count
        if ($virtual_to_restore > 0) {
            $current_virtual = intval(get_post_meta($virtual_deduction['source_flower_id'], '_virtual_preroll_count', true));
            update_post_meta($virtual_deduction['source_flower_id'], '_virtual_preroll_count', $current_virtual + $virtual_to_restore);
        }
        
        // Update WooCommerce stock
        af_mli_update_woo_stock($virtual_deduction['source_flower_id']);
        
        // Log refund
        af_mli_log_preroll_activity($virtual_deduction['source_flower_id'], 'refund', array(
            'order_id' => $order_id,
            'refunded_qty' => $refunded_qty,
            'flower_restored' => $flower_to_restore,
            'virtual_restored' => $virtual_to_restore
        ));
    }
}, 10, 3); 