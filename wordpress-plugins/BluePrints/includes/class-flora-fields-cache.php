<?php
/**
 * Flora Fields Cache Class
 * Handles caching for field data and resolved meta
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_Fields_Cache {
    
    /**
     * Single instance
     */
    private static $_instance = null;
    
    /**
     * Cache group
     */
    const CACHE_GROUP = 'flora_fields';
    
    /**
     * Cache expiration (1 hour)
     */
    const CACHE_EXPIRATION = 3600;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Cache group is automatically handled by WordPress
    }
    
    /**
     * Get instance
     */
    public static function instance() {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    /**
     * Get cached entity meta
     */
    public static function get_entity_meta($entity_type, $entity_id) {
        $cache_key = "meta_{$entity_type}_{$entity_id}";
        return wp_cache_get($cache_key, self::CACHE_GROUP);
    }
    
    /**
     * Set cached entity meta
     */
    public static function set_entity_meta($entity_type, $entity_id, $meta_data, $expiration = null) {
        $cache_key = "meta_{$entity_type}_{$entity_id}";
        $expiration = $expiration ?: self::CACHE_EXPIRATION;
        
        return wp_cache_set($cache_key, $meta_data, self::CACHE_GROUP, $expiration);
    }
    
    /**
     * Delete entity cache
     */
    public static function delete_entity_cache($entity_type, $entity_id) {
        $cache_key = "meta_{$entity_type}_{$entity_id}";
        wp_cache_delete($cache_key, self::CACHE_GROUP);
        
        // Also delete related caches
        self::delete_entity_etag_cache($entity_type, $entity_id);
        self::delete_assignments_cache($entity_type, $entity_id);
    }
    
    /**
     * Get cached ETag
     */
    public static function get_entity_etag($entity_type, $entity_id) {
        $cache_key = "etag_{$entity_type}_{$entity_id}";
        return wp_cache_get($cache_key, self::CACHE_GROUP);
    }
    
    /**
     * Set cached ETag
     */
    public static function set_entity_etag($entity_type, $entity_id, $etag, $expiration = null) {
        $cache_key = "etag_{$entity_type}_{$entity_id}";
        $expiration = $expiration ?: self::CACHE_EXPIRATION;
        
        return wp_cache_set($cache_key, $etag, self::CACHE_GROUP, $expiration);
    }
    
    /**
     * Delete ETag cache
     */
    public static function delete_entity_etag_cache($entity_type, $entity_id) {
        $cache_key = "etag_{$entity_type}_{$entity_id}";
        wp_cache_delete($cache_key, self::CACHE_GROUP);
    }
    
    /**
     * Get cached field assignments
     */
    public static function get_assignments_cache($entity_type, $entity_id = null, $category_id = null) {
        $cache_key = "assignments_{$entity_type}";
        if ($entity_id !== null) {
            $cache_key .= "_{$entity_id}";
        }
        if ($category_id !== null) {
            $cache_key .= "_cat_{$category_id}";
        }
        
        return wp_cache_get($cache_key, self::CACHE_GROUP);
    }
    
    /**
     * Set cached field assignments
     */
    public static function set_assignments_cache($entity_type, $assignments, $entity_id = null, $category_id = null, $expiration = null) {
        $cache_key = "assignments_{$entity_type}";
        if ($entity_id !== null) {
            $cache_key .= "_{$entity_id}";
        }
        if ($category_id !== null) {
            $cache_key .= "_cat_{$category_id}";
        }
        
        $expiration = $expiration ?: self::CACHE_EXPIRATION;
        
        return wp_cache_set($cache_key, $assignments, self::CACHE_GROUP, $expiration);
    }
    
    /**
     * Delete assignments cache
     */
    public static function delete_assignments_cache($entity_type, $entity_id = null, $category_id = null) {
        $cache_key = "assignments_{$entity_type}";
        if ($entity_id !== null) {
            $cache_key .= "_{$entity_id}";
        }
        if ($category_id !== null) {
            $cache_key .= "_cat_{$category_id}";
        }
        
        wp_cache_delete($cache_key, self::CACHE_GROUP);
    }
    
    /**
     * Get cached blueprints
     */
    public static function get_blueprints_cache($args = array()) {
        $cache_key = 'blueprints_' . md5(serialize($args));
        $version = wp_cache_get('blueprints_version', self::CACHE_GROUP) ?: 1;
        $versioned_key = $cache_key . '_v' . $version;
        return wp_cache_get($versioned_key, self::CACHE_GROUP);
    }
    
    /**
     * Set cached blueprints
     */
    public static function set_blueprints_cache($blueprints, $args = array(), $expiration = null) {
        $cache_key = 'blueprints_' . md5(serialize($args));
        $version = wp_cache_get('blueprints_version', self::CACHE_GROUP) ?: 1;
        $versioned_key = $cache_key . '_v' . $version;
        $expiration = $expiration ?: self::CACHE_EXPIRATION;
        
        return wp_cache_set($versioned_key, $blueprints, self::CACHE_GROUP, $expiration);
    }
    
    /**
     * Clear all blueprints cache
     */
    public static function clear_blueprints_cache() {
        // Increment version to invalidate all versioned cache entries
        $version = wp_cache_get('blueprints_version', self::CACHE_GROUP);
        if (!$version) {
            $version = 1;
        }
        wp_cache_set('blueprints_version', $version + 1, self::CACHE_GROUP, 86400);
        
        // Also try to clear common cache keys directly as backup
        $common_args = array(
            array('status' => 'active', 'type' => ''),
            array('status' => 'active'),
            array()
        );
        
        foreach ($common_args as $args) {
            $cache_key = 'blueprints_' . md5(serialize($args));
            // Clear both old and new versioned keys
            wp_cache_delete($cache_key, self::CACHE_GROUP);
            wp_cache_delete($cache_key . '_v' . $version, self::CACHE_GROUP);
            wp_cache_delete($cache_key . '_v' . ($version + 1), self::CACHE_GROUP);
        }
        
        // Clear WordPress object cache
        wp_cache_flush();
        
        // Clear transients that might be caching our data
        delete_transient('flora_fields_blueprints');
        delete_transient('flora_fields_blueprints_active');
        
        // Clear any REST API cache
        if (function_exists('wp_cache_flush_group')) {
            wp_cache_flush_group('rest-api');
            wp_cache_flush_group('fd/v1');
        }
        
        // Force clear opcache if available
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }
        
        error_log('Flora Fields: All caches cleared aggressively');
    }
    
    /**
     * Flush all flora fields cache
     */
    public static function flush_all() {
        wp_cache_flush_group(self::CACHE_GROUP);
    }
    
    /**
     * Get cache statistics (for debugging)
     */
    public static function get_cache_stats() {
        // This would need to be implemented based on the caching backend
        return array(
            'group' => self::CACHE_GROUP,
            'expiration' => self::CACHE_EXPIRATION,
            'status' => 'active'
        );
    }
    
    /**
     * Warm cache for entity
     */
    public static function warm_entity_cache($entity_type, $entity_id) {
        // Get fresh data from database
        $meta = Flora_Fields_Database::get_catalog_meta($entity_type, $entity_id);
        
        if ($meta) {
            $meta_data = json_decode($meta->meta_json, true);
            self::set_entity_meta($entity_type, $entity_id, $meta_data);
            self::set_entity_etag($entity_type, $entity_id, $meta->etag);
        }
    }
}