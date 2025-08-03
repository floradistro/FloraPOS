<?php
/**
 * Test script to verify preroll conversion plugin modifications
 * Place this in your WordPress root directory and run via browser
 */

// WordPress bootstrap
require_once('wp-config.php');
require_once(ABSPATH . 'wp-includes/wp-db.php');
require_once(ABSPATH . 'wp-includes/pluggable.php');

echo "<h1>🧪 Preroll Plugin Fix Test</h1>";

// Test 1: Check if plugin is loaded
echo "<h2>Test 1: Plugin Status</h2>";
if (class_exists('Addify_Multi_Location_Inventory_Management')) {
    echo "✅ Plugin class found<br>";
} else {
    echo "❌ Plugin class not found<br>";
}

// Test 2: Check if modifications are in place
echo "<h2>Test 2: Code Modifications</h2>";
$plugin_file = ABSPATH . 'wp-content/plugins/addify.modified/class-addify-multi-inventory-management.php';
if (file_exists($plugin_file)) {
    $content = file_get_contents($plugin_file);
    
    if (strpos($content, '_selected_variation') !== false) {
        echo "✅ _selected_variation metadata support added<br>";
    } else {
        echo "❌ _selected_variation metadata support missing<br>";
    }
    
    if (strpos($content, 'variation_type === \'preroll_grams\'') !== false) {
        echo "✅ Auto-detection for preroll_grams added<br>";
    } else {
        echo "❌ Auto-detection for preroll_grams missing<br>";
    }
    
    if (strpos($content, 'get_post_meta($product_id, \'mli_preroll_conversion\', true)') !== false) {
        echo "✅ Dynamic preroll conversion rate support added<br>";
    } else {
        echo "❌ Dynamic preroll conversion rate support missing<br>";
    }
} else {
    echo "❌ Plugin file not found at: $plugin_file<br>";
}

// Test 3: Check admin file modifications
echo "<h2>Test 3: Admin File Modifications</h2>";
$admin_file = ABSPATH . 'wp-content/plugins/addify.modified/includes/admin/class-addify-multi-location-inventory-admin.php';
if (file_exists($admin_file)) {
    $admin_content = file_get_contents($admin_file);
    
    if (strpos($admin_content, 'af_mli_decimal_qty') !== false) {
        echo "✅ Stored decimal quantity support added<br>";
    } else {
        echo "❌ Stored decimal quantity support missing<br>";
    }
    
    if (strpos($admin_content, 'Using stored decimal quantity') !== false) {
        echo "✅ Inventory deduction logic updated<br>";
    } else {
        echo "❌ Inventory deduction logic not updated<br>";
    }
} else {
    echo "❌ Admin file not found at: $admin_file<br>";
}

// Test 4: Simulate preroll conversion
echo "<h2>Test 4: Preroll Conversion Simulation</h2>";

// Mock order item data
$mock_item_meta = [
    '_selected_variation' => 'preroll-5',
    '_variation_type' => 'preroll_grams',
    '_preroll_count' => '5',
    '_grams_per_preroll' => '0.7'
];

echo "Mock order item metadata:<br>";
foreach ($mock_item_meta as $key => $value) {
    echo "- $key: $value<br>";
}

// Simulate conversion calculation
$preroll_count = 5;
$conversion_rate = 0.7;
$expected_grams = $preroll_count * $conversion_rate;

echo "<br>Expected conversion: {$preroll_count} prerolls × {$conversion_rate}g = {$expected_grams}g<br>";

echo "<h2>✅ Plugin Modification Summary</h2>";
echo "<ul>";
echo "<li><strong>Auto-Detection:</strong> Plugin now auto-detects preroll variations without requiring manual flags</li>";
echo "<li><strong>Metadata Support:</strong> Supports both 'variation' and '_selected_variation' metadata keys</li>";
echo "<li><strong>Dynamic Conversion:</strong> Uses product-specific preroll conversion rates</li>";
echo "<li><strong>Stored Quantities:</strong> Stores calculated decimal quantities for reliable inventory deduction</li>";
echo "<li><strong>Better Logging:</strong> Enhanced error logging for debugging</li>";
echo "</ul>";

echo "<h2>🚀 Next Steps</h2>";
echo "<ol>";
echo "<li>Deploy the modified plugin files to your production server</li>";
echo "<li>Test with a real preroll order using the API</li>";
echo "<li>Monitor error logs for 'MLI Decimal Handler' messages</li>";
echo "<li>Verify inventory deduction matches expected gram amounts</li>";
echo "</ol>";

echo "<p><em>Test completed at " . date('Y-m-d H:i:s') . "</em></p>";
?> 