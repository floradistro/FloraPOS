<?php
/**
 * Diagnostic script to check if plugin modifications are in place
 * Upload this to your WordPress root and access via browser
 */

echo "<h1>🔍 Plugin Modification Diagnostic</h1>";

// Check main plugin file
$main_file = 'wp-content/plugins/addify.modified/class-addify-multi-inventory-management.php';
echo "<h2>Main Plugin File: $main_file</h2>";

if (file_exists($main_file)) {
    $content = file_get_contents($main_file);
    
    echo "<h3>✅ File exists. Checking modifications:</h3>";
    
    // Check for key modifications
    $checks = [
        '_selected_variation' => 'API order metadata support',
        'variation_type === \'preroll_grams\'' => 'Auto-detection logic',
        'get_post_meta($product_id, \'mli_preroll_conversion\', true)' => 'Dynamic conversion rates',
        'af_mli_decimal_qty' => 'Decimal quantity storage',
        'Setting last_deducted_qty to decimal quantity' => 'Fixed last_deducted_qty logic'
    ];
    
    foreach ($checks as $search => $description) {
        if (strpos($content, $search) !== false) {
            echo "✅ $description: FOUND<br>";
        } else {
            echo "❌ $description: MISSING<br>";
        }
    }
    
    // Check specific function
    if (strpos($content, 'af_handle_decimal_quantities') !== false) {
        echo "<br><h3>🔍 af_handle_decimal_quantities function analysis:</h3>";
        
        // Extract the function
        $start = strpos($content, 'private function af_handle_decimal_quantities');
        if ($start !== false) {
            $end = strpos($content, 'private function', $start + 1);
            if ($end === false) $end = strpos($content, 'public function', $start + 1);
            if ($end === false) $end = strpos($content, '}', $start + 500);
            
            $function = substr($content, $start, $end - $start);
            echo "<pre style='background:#f0f0f0; padding:10px; font-size:12px;'>";
            echo htmlspecialchars(substr($function, 0, 1000));
            if (strlen($function) > 1000) echo "\n... (truncated)";
            echo "</pre>";
        }
    }
    
} else {
    echo "❌ File not found!";
}

// Check admin file
$admin_file = 'wp-content/plugins/addify.modified/includes/admin/class-addify-multi-location-inventory-admin.php';
echo "<h2>Admin File: $admin_file</h2>";

if (file_exists($admin_file)) {
    $admin_content = file_get_contents($admin_file);
    
    echo "<h3>✅ File exists. Checking modifications:</h3>";
    
    $admin_checks = [
        'Using stored decimal quantity' => 'Inventory deduction priority logic',
        '_selected_variation' => 'API metadata support in admin',
        'af_mli_decimal_qty' => 'Stored decimal quantity usage'
    ];
    
    foreach ($admin_checks as $search => $description) {
        if (strpos($admin_content, $search) !== false) {
            echo "✅ $description: FOUND<br>";
        } else {
            echo "❌ $description: MISSING<br>";
        }
    }
    
} else {
    echo "❌ File not found!";
}

// Check WordPress/WooCommerce version
echo "<h2>Environment Check</h2>";
if (file_exists('wp-config.php')) {
    echo "✅ WordPress installation detected<br>";
    
    // Try to load WordPress
    try {
        require_once('wp-config.php');
        echo "✅ WordPress loaded successfully<br>";
        
        if (function_exists('get_option')) {
            $wp_version = get_option('db_version');
            echo "✅ WordPress DB version: $wp_version<br>";
        }
        
        if (class_exists('WooCommerce')) {
            echo "✅ WooCommerce is active<br>";
        } else {
            echo "⚠️ WooCommerce not detected<br>";
        }
        
        if (class_exists('Addify_Multi_Location_Inventory_Management')) {
            echo "✅ Addify plugin class found<br>";
        } else {
            echo "❌ Addify plugin class not found<br>";
        }
        
    } catch (Exception $e) {
        echo "❌ Error loading WordPress: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ wp-config.php not found<br>";
}

echo "<h2>🚀 Recommendations</h2>";
echo "<ol>";
echo "<li>If modifications are missing, re-upload the modified plugin files</li>";
echo "<li>Clear any WordPress/plugin caches</li>";
echo "<li>Deactivate and reactivate the plugin</li>";
echo "<li>Check WordPress error logs for any PHP errors</li>";
echo "<li>Verify file permissions allow PHP to read the modified files</li>";
echo "</ol>";

echo "<p><em>Diagnostic completed at " . date('Y-m-d H:i:s') . "</em></p>";
?> 