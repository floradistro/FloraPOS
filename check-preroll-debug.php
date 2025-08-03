<?php
/**
 * Script to retrieve and display the preroll debug log
 * Upload this to WordPress root and access it to see debug info
 */

header('Content-Type: text/plain');

$debug_file = __DIR__ . '/preroll-debug.log';

echo "=== Preroll Debug Log Contents ===\n\n";
echo "Looking for debug file at: " . $debug_file . "\n\n";

if (file_exists($debug_file)) {
    echo "File found! Size: " . filesize($debug_file) . " bytes\n";
    echo "Last modified: " . date('Y-m-d H:i:s', filemtime($debug_file)) . "\n\n";
    echo "Contents:\n";
    echo str_repeat('-', 80) . "\n";
    
    // Read and display the file
    $contents = file_get_contents($debug_file);
    echo $contents;
    
    echo "\n" . str_repeat('-', 80) . "\n";
    echo "\nEnd of file\n";
} else {
    echo "Debug file not found!\n\n";
    echo "This could mean:\n";
    echo "1. The order processing hasn't triggered yet\n";
    echo "2. The file is being written to a different location\n";
    echo "3. There's a permission issue preventing file creation\n";
}

// Also check for the file in wp-content
$alt_debug_file = __DIR__ . '/wp-content/preroll-debug.log';
if (file_exists($alt_debug_file)) {
    echo "\n\nFound alternate debug file at: " . $alt_debug_file . "\n";
    echo "Contents:\n";
    echo file_get_contents($alt_debug_file);
}

// Check WordPress constant ABSPATH
if (defined('ABSPATH')) {
    echo "\n\nABSPATH is defined as: " . ABSPATH . "\n";
    $wp_debug_file = ABSPATH . 'preroll-debug.log';
    if (file_exists($wp_debug_file)) {
        echo "Found debug file at ABSPATH location!\n";
        echo file_get_contents($wp_debug_file);
    }
} else {
    echo "\n\nABSPATH is not defined - this script needs to be included in WordPress\n";
}

echo "\n\nScript completed at: " . date('Y-m-d H:i:s') . "\n";
?> 