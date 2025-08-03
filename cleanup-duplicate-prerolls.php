<?php
/**
 * Cleanup duplicate pre-roll products
 * 
 * Run this script to remove duplicate pre-roll products created by the bug
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied');
}

echo "<h1>Pre-Roll Products Cleanup</h1>";

// Safety check - only run if confirmed
if (!isset($_GET['confirm'])) {
    // Find pre-roll products by name pattern OR metadata
    global $wpdb;
    
    // Method 1: Find by name pattern
    $name_pattern_results = $wpdb->get_results("
        SELECT ID FROM {$wpdb->posts} 
        WHERE post_type = 'product' 
        AND post_status IN ('publish', 'draft', 'private', 'trash')
        AND post_title LIKE '%Pre-roll%'
    ");
    
    $preroll_ids = array();
    foreach ($name_pattern_results as $result) {
        $preroll_ids[] = $result->ID;
    }
    
    // Method 2: Find by metadata
    $meta_results = $wpdb->get_results("
        SELECT DISTINCT post_id FROM {$wpdb->postmeta}
        WHERE meta_key = '_product_type' AND meta_value = 'preroll'
    ");
    
    foreach ($meta_results as $result) {
        if (!in_array($result->post_id, $preroll_ids)) {
            $preroll_ids[] = $result->post_id;
        }
    }
    
    echo "<p>Found " . count($preroll_ids) . " pre-roll products (by name pattern and metadata)</p>";
    
    if (count($preroll_ids) > 0) {
        echo "<h2>Pre-roll products found:</h2>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Title</th><th>SKU</th><th>Status</th><th>Categories</th><th>Source Flower ID</th><th>Date Created</th></tr>";
        
        $products_by_name = array();
        
        foreach ($preroll_ids as $id) {
            $product = get_post($id);
            if (!$product) continue;
            
            $sku = get_post_meta($id, '_sku', true);
            $source_id = get_post_meta($id, '_source_flower_product_id', true);
            $categories = wp_get_post_terms($id, 'product_cat', array('fields' => 'names'));
            $cat_list = implode(', ', $categories);
            
            // Clean the title to group duplicates
            $clean_title = trim(str_replace('Pre-rolls', '', $product->post_title));
            $clean_title = trim(str_replace('Pre-roll', '', $clean_title));
            
            if (!isset($products_by_name[$clean_title])) {
                $products_by_name[$clean_title] = array();
            }
            
            $products_by_name[$clean_title][] = array(
                'id' => $id,
                'title' => $product->post_title,
                'sku' => $sku,
                'status' => $product->post_status,
                'categories' => $cat_list,
                'source_id' => $source_id,
                'date' => $product->post_date
            );
            
            echo "<tr>";
            echo "<td>{$id}</td>";
            echo "<td>{$product->post_title}</td>";
            echo "<td>{$sku}</td>";
            echo "<td>{$product->post_status}</td>";
            echo "<td>{$cat_list}</td>";
            echo "<td>{$source_id}</td>";
            echo "<td>{$product->post_date}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Show duplicate analysis
        echo "<h2>Duplicate Analysis:</h2>";
        $total_duplicates = 0;
        foreach ($products_by_name as $name => $products) {
            if (count($products) > 1) {
                echo "<p><strong>{$name}</strong> has " . count($products) . " pre-roll products:</p>";
                echo "<ul>";
                foreach ($products as $pr) {
                    echo "<li>ID: {$pr['id']} - {$pr['title']} (Status: {$pr['status']}, Categories: {$pr['categories']})</li>";
                }
                echo "</ul>";
                $total_duplicates += (count($products) - 1);
            }
        }
        
        echo "<p><strong>Total duplicates to remove: {$total_duplicates}</strong></p>";
        
        echo "<hr>";
        echo "<p><strong>WARNING:</strong> This will delete duplicate pre-roll products.</p>";
        echo "<p><a href='?confirm=duplicates' onclick='return confirm(\"Delete duplicate pre-rolls keeping one per product?\")' style='background: orange; color: white; padding: 10px; text-decoration: none;'>DELETE DUPLICATES ONLY</a></p>";
        echo "<p><a href='?confirm=all' onclick='return confirm(\"Delete ALL pre-roll products?\")' style='background: red; color: white; padding: 10px; text-decoration: none;'>DELETE ALL PRE-ROLLS</a></p>";
    }
    
} else {
    // Perform cleanup
    global $wpdb;
    
    // Find all pre-roll products
    $name_pattern_results = $wpdb->get_results("
        SELECT ID FROM {$wpdb->posts} 
        WHERE post_type = 'product' 
        AND post_status IN ('publish', 'draft', 'private', 'trash')
        AND post_title LIKE '%Pre-roll%'
    ");
    
    $preroll_ids = array();
    foreach ($name_pattern_results as $result) {
        $preroll_ids[] = $result->ID;
    }
    
    if ($_GET['confirm'] === 'all') {
        // Delete all pre-rolls
        $deleted = 0;
        foreach ($preroll_ids as $id) {
            // Delete associated inventories first
            $inventories = get_posts(array(
                'post_type'   => 'af_prod_lvl_invent',
                'post_status' => 'any',
                'numberposts' => -1,
                'post_parent' => $id,
            ));
            
            foreach ($inventories as $inventory) {
                wp_delete_post($inventory->ID, true);
            }
            
            // Delete the product
            wp_delete_post($id, true);
            $deleted++;
            
            echo "<p>Deleted pre-roll product #{$id}</p>";
        }
        
        echo "<p><strong>Deleted {$deleted} pre-roll products</strong></p>";
        
        // Clear linked product references
        $wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key = '_linked_preroll_product_id'");
        
    } elseif ($_GET['confirm'] === 'duplicates') {
        // Delete only duplicates
        $products_by_name = array();
        
        foreach ($preroll_ids as $id) {
            $product = get_post($id);
            if (!$product) continue;
            
            // Clean the title to group duplicates
            $clean_title = trim(str_replace('Pre-rolls', '', $product->post_title));
            $clean_title = trim(str_replace('Pre-roll', '', $clean_title));
            
            if (!isset($products_by_name[$clean_title])) {
                $products_by_name[$clean_title] = array();
            }
            
            $products_by_name[$clean_title][] = array(
                'id' => $id,
                'date' => strtotime($product->post_date)
            );
        }
        
        $deleted = 0;
        foreach ($products_by_name as $name => $products) {
            if (count($products) > 1) {
                // Sort by date, keep oldest
                usort($products, function($a, $b) {
                    return $a['date'] - $b['date'];
                });
                
                // Keep first one, delete the rest
                for ($i = 1; $i < count($products); $i++) {
                    $id = $products[$i]['id'];
                    
                    // Delete associated inventories
                    $inventories = get_posts(array(
                        'post_type'   => 'af_prod_lvl_invent',
                        'post_status' => 'any',
                        'numberposts' => -1,
                        'post_parent' => $id,
                    ));
                    
                    foreach ($inventories as $inventory) {
                        wp_delete_post($inventory->ID, true);
                    }
                    
                    // Delete the product
                    wp_delete_post($id, true);
                    $deleted++;
                    
                    echo "<p>Deleted duplicate pre-roll product #{$id}</p>";
                }
            }
        }
        
        echo "<p><strong>Deleted {$deleted} duplicate pre-roll products</strong></p>";
    }
    
    // Clear all scheduled events
    $timestamp = wp_next_scheduled('af_mli_create_float_product');
    while ($timestamp) {
        wp_unschedule_event($timestamp, 'af_mli_create_float_product');
        $timestamp = wp_next_scheduled('af_mli_create_float_product');
    }
    
    // Clear all transients
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mli_creating_preroll_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_mli_creating_preroll_%'");
    
    // Clear any stuck cron jobs
    $cron = get_option('cron');
    if (is_array($cron)) {
        foreach ($cron as $timestamp => $hooks) {
            if (is_array($hooks) && isset($hooks['af_mli_create_float_product'])) {
                unset($cron[$timestamp]['af_mli_create_float_product']);
                if (empty($cron[$timestamp])) {
                    unset($cron[$timestamp]);
                }
            }
        }
        update_option('cron', $cron);
    }
    
    echo "<p>Cleared all scheduled events and transients</p>";
}

echo "<hr>";
echo "<p><a href='cleanup-duplicate-prerolls.php'>Back to cleanup tool</a></p>";
?> 