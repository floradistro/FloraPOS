<?php
/**
 * Check virtual pre-roll processing logs and debug info
 */

// Get WordPress error log location
$wp_debug_log = ini_get('error_log');
echo "WordPress Error Log Location: " . $wp_debug_log . "\n\n";

// Check last 100 lines of error log for our debug messages
if (file_exists($wp_debug_log)) {
    echo "=== Recent Virtual Pre-roll Log Entries ===\n";
    $lines = file($wp_debug_log);
    $recent_lines = array_slice($lines, -100);
    
    foreach ($recent_lines as $line) {
        if (strpos($line, 'MLI') !== false || 
            strpos($line, 'PREROLL') !== false ||
            strpos($line, 'VIRTUAL') !== false ||
            strpos($line, 'preroll') !== false) {
            echo $line;
        }
    }
} else {
    echo "Error log file not found at: " . $wp_debug_log . "\n";
}

// Alternative log locations to check
$alt_logs = [
    '/var/log/apache2/error.log',
    '/var/log/nginx/error.log',
    '/var/log/php/error.log',
    '/var/log/php-fpm/error.log',
    '/tmp/wordpress-errors.log',
    dirname(__FILE__) . '/wp-content/debug.log'
];

echo "\n=== Checking Alternative Log Locations ===\n";
foreach ($alt_logs as $log) {
    if (file_exists($log) && is_readable($log)) {
        echo "Found log at: $log\n";
        $lines = file($log);
        $recent = array_slice($lines, -50);
        foreach ($recent as $line) {
            if (stripos($line, 'MLI') !== false || stripos($line, 'preroll') !== false) {
                echo "  > " . trim($line) . "\n";
            }
        }
    }
}

// Check if WP_DEBUG is enabled
echo "\n=== WordPress Debug Settings ===\n";
if (defined('WP_DEBUG')) {
    echo "WP_DEBUG: " . (WP_DEBUG ? 'true' : 'false') . "\n";
} else {
    echo "WP_DEBUG: not defined\n";
}

if (defined('WP_DEBUG_LOG')) {
    echo "WP_DEBUG_LOG: " . (WP_DEBUG_LOG ? 'true' : 'false') . "\n";
} else {
    echo "WP_DEBUG_LOG: not defined\n";
}

if (defined('WP_DEBUG_DISPLAY')) {
    echo "WP_DEBUG_DISPLAY: " . (WP_DEBUG_DISPLAY ? 'true' : 'false') . "\n";
} else {
    echo "WP_DEBUG_DISPLAY: not defined\n";
}

// Test virtual pre-roll metadata directly
echo "\n=== Testing Product Virtual Pre-roll Data ===\n";
$product_id = 766; // Lemon Cherry Gelato

// Check if we can access WordPress functions
if (!function_exists('get_post_meta')) {
    echo "ERROR: WordPress functions not available. This script must be run through WordPress.\n";
    echo "Upload to WordPress root and access via: https://api.floradistro.com/check-preroll-logs.php\n";
} else {
    $virtual_count = get_post_meta($product_id, '_virtual_preroll_count', true);
    $preroll_conversion = get_post_meta($product_id, 'mli_preroll_conversion', true);
    
    echo "Product ID $product_id:\n";
    echo "  Virtual pre-rolls: " . ($virtual_count ?: '0') . "\n";
    echo "  Conversion rate: " . ($preroll_conversion ?: '0.7 (default)') . "\n";
}
?> 