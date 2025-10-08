<?php
/**
 * Flora Fields Pricing Engine
 * Stage 4: Pricing Rules Model + Evaluator
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_Fields_Pricing {
    
    private static $_instance = null;
    
    public static function instance() {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    /**
     * Create pricing rules for a product
     */
    public static function create_pricing_rule($data) {
        global $wpdb;
        
        $defaults = array(
            'product_id' => 0,
            'rule_name' => '',
            'rule_type' => 'quantity_break', // quantity_break, customer_tier, channel, store, time_window
            'priority' => 10,
            'conditions' => '{}', // JSON
            'formula' => '', // pricing formula
            'start_date' => null,
            'end_date' => null,
            'is_active' => 1,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        
        $data = wp_parse_args($data, $defaults);
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'fd_pricing_rules',
            $data,
            array('%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', 'Failed to create pricing rule');
        }
        
        $rule_id = $wpdb->insert_id;
        
        // Trigger price list regeneration
        self::regenerate_price_lists($data['product_id']);
        
        return $rule_id;
    }
    
    /**
     * Get pricing rules for product
     */
    public static function get_pricing_rules($product_id = null, $active_only = true, $blueprint_id = null) {
        global $wpdb;
        
        $where = array();
        $values = array();
        
        if ($product_id !== null) {
            $where[] = "(product_id = %d OR product_id = 0)";
            $values[] = $product_id;
        }
        
        if ($blueprint_id !== null) {
            $where[] = "blueprint_id = %d";
            $values[] = $blueprint_id;
        }
        
        if ($active_only) {
            $where[] = "is_active = 1";
        }
        
        $sql = "SELECT * FROM {$wpdb->prefix}fd_pricing_rules";
        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }
        $sql .= " ORDER BY priority ASC, created_at ASC";
        
        if (!empty($values)) {
            return $wpdb->get_results($wpdb->prepare($sql, $values));
        }
        
        return $wpdb->get_results($sql);
    }
    
    /**
     * Evaluate pricing for product with context
     */
    public static function evaluate_price($product_id, $context = array()) {
        $defaults = array(
            'quantity' => 1,
            'customer_tier' => '',
            'channel' => '',
            'store_id' => 0,
            'customer_id' => 0,
            'date' => current_time('mysql')
        );
        
        $context = wp_parse_args($context, $defaults);
        
        // Get base price
        $base_price = self::get_base_price($product_id);
        if (!$base_price) {
            return new WP_Error('no_base_price', 'No base price found for product');
        }
        
        // Get applicable rules
        $rules = self::get_pricing_rules($product_id, true);
        $applicable_rules = array();
        
        foreach ($rules as $rule) {
            if (self::is_rule_applicable($rule, $context)) {
                $applicable_rules[] = $rule;
            }
        }
        
        // Apply rules in priority order
        $final_price = $base_price;
        $applied_rules = array();
        
        foreach ($applicable_rules as $rule) {
            $new_price = self::apply_pricing_rule($final_price, $rule, $context);
            if ($new_price !== $final_price) {
                $final_price = $new_price;
                $applied_rules[] = array(
                    'rule_id' => $rule->id,
                    'rule_name' => $rule->rule_name,
                    'rule_type' => $rule->rule_type,
                    'original_price' => $final_price,
                    'new_price' => $new_price
                );
            }
        }
        
        return array(
            'product_id' => $product_id,
            'base_price' => $base_price,
            'final_price' => $final_price,
            'context' => $context,
            'applied_rules' => $applied_rules
        );
    }
    
    /**
     * Check if pricing rule is applicable
     */
    private static function is_rule_applicable($rule, $context) {
        // Check date range
        if ($rule->start_date && strtotime($context['date']) < strtotime($rule->start_date)) {
            return false;
        }
        
        if ($rule->end_date && strtotime($context['date']) > strtotime($rule->end_date)) {
            return false;
        }
        
        // Parse conditions
        $conditions = json_decode($rule->conditions, true);
        if (empty($conditions)) {
            return true;
        }
        
        // Check quantity breaks
        if ($rule->rule_type === 'quantity_break' && isset($conditions['min_quantity'])) {
            if ($context['quantity'] < $conditions['min_quantity']) {
                return false;
            }
        }
        
        // Check customer tier
        if ($rule->rule_type === 'customer_tier' && isset($conditions['tier'])) {
            if ($context['customer_tier'] !== $conditions['tier']) {
                return false;
            }
        }
        
        // Check channel
        if ($rule->rule_type === 'channel' && isset($conditions['channel'])) {
            if ($context['channel'] !== $conditions['channel']) {
                return false;
            }
        }
        
        // Check store
        if ($rule->rule_type === 'store' && isset($conditions['store_id'])) {
            if ($context['store_id'] != $conditions['store_id']) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Apply pricing rule to current price
     */
    private static function apply_pricing_rule($current_price, $rule, $context) {
        if (empty($rule->formula)) {
            return $current_price;
        }
        
        // Parse formula - support basic operations
        $formula = $rule->formula;
        
        // Replace variables
        $formula = str_replace('{base_price}', $current_price, $formula);
        $formula = str_replace('{quantity}', $context['quantity'], $formula);
        
        // Parse conditions for additional variables
        $conditions = json_decode($rule->conditions, true);
        if (!empty($conditions)) {
            foreach ($conditions as $key => $value) {
                $formula = str_replace('{' . $key . '}', $value, $formula);
            }
        }
        
        // Evaluate simple formulas
        try {
            // Security: Only allow basic math operations
            if (preg_match('/^[\d\+\-\*\/\(\)\.\s]+$/', $formula)) {
                $new_price = eval("return $formula;");
                return max(0, floatval($new_price)); // Ensure positive price
            }
        } catch (Exception $e) {
            error_log('Pricing formula error: ' . $e->getMessage());
        }
        
        return $current_price;
    }
    
    /**
     * Get base price for product
     */
    private static function get_base_price($product_id) {
        // Try to get from WooCommerce first
        if (function_exists('wc_get_product')) {
            $product = wc_get_product($product_id);
            if ($product) {
                return floatval($product->get_regular_price());
            }
        }
        
        // Fallback to custom field or default
        $price = get_post_meta($product_id, '_regular_price', true);
        return $price ? floatval($price) : 0.0;
    }
    
    /**
     * Regenerate denormalized price lists for product
     */
    public static function regenerate_price_lists($product_id) {
        global $wpdb;
        
        // Delete existing price lists for this product
        $wpdb->delete(
            $wpdb->prefix . 'fd_price_lists',
            array('product_id' => $product_id),
            array('%d')
        );
        
        // Generate common pricing scenarios
        $scenarios = array(
            // Quantity breaks
            array('quantity' => 1, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            array('quantity' => 5, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            array('quantity' => 10, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            array('quantity' => 25, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            array('quantity' => 50, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            array('quantity' => 100, 'customer_tier' => '', 'channel' => '', 'store_id' => 0),
            
            // Customer tiers
            array('quantity' => 1, 'customer_tier' => 'wholesale', 'channel' => '', 'store_id' => 0),
            array('quantity' => 1, 'customer_tier' => 'retail', 'channel' => '', 'store_id' => 0),
            array('quantity' => 1, 'customer_tier' => 'premium', 'channel' => '', 'store_id' => 0),
            
            // Channels
            array('quantity' => 1, 'customer_tier' => '', 'channel' => 'online', 'store_id' => 0),
            array('quantity' => 1, 'customer_tier' => '', 'channel' => 'retail', 'store_id' => 0),
            array('quantity' => 1, 'customer_tier' => '', 'channel' => 'wholesale', 'store_id' => 0)
        );
        
        foreach ($scenarios as $scenario) {
            $scenario['customer_id'] = 0;
            $scenario['date'] = current_time('mysql');
            
            $price_result = self::evaluate_price($product_id, $scenario);
            
            if (!is_wp_error($price_result)) {
                $wpdb->insert(
                    $wpdb->prefix . 'fd_price_lists',
                    array(
                        'product_id' => $product_id,
                        'quantity' => $scenario['quantity'],
                        'customer_tier' => $scenario['customer_tier'],
                        'channel' => $scenario['channel'],
                        'store_id' => $scenario['store_id'],
                        'price' => $price_result['final_price'],
                        'base_price' => $price_result['base_price'],
                        'rules_applied' => json_encode($price_result['applied_rules']),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ),
                    array('%d', '%d', '%s', '%s', '%d', '%f', '%f', '%s', '%s', '%s')
                );
            }
        }
    }
    
    /**
     * Get price list matrix for product
     */
    public static function get_price_list($product_id, $filters = array()) {
        global $wpdb;
        
        $where = array("product_id = %d");
        $values = array($product_id);
        
        if (!empty($filters['customer_tier'])) {
            $where[] = "customer_tier = %s";
            $values[] = $filters['customer_tier'];
        }
        
        if (!empty($filters['channel'])) {
            $where[] = "channel = %s";
            $values[] = $filters['channel'];
        }
        
        if (!empty($filters['store_id'])) {
            $where[] = "store_id = %d";
            $values[] = $filters['store_id'];
        }
        
        $sql = "SELECT * FROM {$wpdb->prefix}fd_price_lists WHERE " . implode(' AND ', $where) . " ORDER BY quantity ASC";
        
        return $wpdb->get_results($wpdb->prepare($sql, $values));
    }
    
    /**
     * Bulk regenerate all price lists
     */
    public static function bulk_regenerate_price_lists($product_ids = null) {
        if ($product_ids === null) {
            // Get all products with pricing rules
            global $wpdb;
            $product_ids = $wpdb->get_col("SELECT DISTINCT product_id FROM {$wpdb->prefix}fd_pricing_rules WHERE product_id > 0");
        }
        
        if (!is_array($product_ids)) {
            $product_ids = array($product_ids);
        }
        
        foreach ($product_ids as $product_id) {
            self::regenerate_price_lists($product_id);
        }
        
        return count($product_ids);
    }
    
    /**
     * Delete pricing rule
     */
    public static function delete_pricing_rule($rule_id) {
        global $wpdb;
        
        $rule_id = (int) $rule_id;
        if (!$rule_id) {
            return new WP_Error('invalid_id', 'Invalid pricing rule ID');
        }
        
        // Check if rule exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}fd_pricing_rules WHERE id = %d",
            $rule_id
        ));
        
        if (!$exists) {
            return new WP_Error('not_found', 'Pricing rule not found');
        }
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'fd_pricing_rules',
            array('id' => $rule_id),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('delete_failed', 'Failed to delete pricing rule: ' . $wpdb->last_error);
        }
        
        return $result > 0;
    }
    
    /**
     * Update pricing rule
     */
    public static function update_pricing_rule($rule_id, $data) {
        global $wpdb;
        
        $rule_id = (int) $rule_id;
        if (!$rule_id) {
            return new WP_Error('invalid_id', 'Invalid pricing rule ID');
        }
        
        // Check if rule exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}fd_pricing_rules WHERE id = %d",
            $rule_id
        ));
        
        if (!$exists) {
            return new WP_Error('not_found', 'Pricing rule not found');
        }
        
        // Add updated timestamp
        $data['updated_at'] = current_time('mysql');
        
        // Determine format array based on data
        $format = array();
        foreach ($data as $key => $value) {
            switch ($key) {
                case 'product_id':
                case 'priority':
                case 'is_active':
                    $format[] = '%d';
                    break;
                case 'rule_name':
                case 'rule_type':
                case 'formula':
                case 'conditions':
                case 'start_date':
                case 'end_date':
                case 'created_at':
                case 'updated_at':
                    $format[] = '%s';
                    break;
                default:
                    $format[] = '%s';
            }
        }
        
        $result = $wpdb->update(
            $wpdb->prefix . 'fd_pricing_rules',
            $data,
            array('id' => $rule_id),
            $format,
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update pricing rule: ' . $wpdb->last_error);
        }
        
        return $result !== false;
    }
}