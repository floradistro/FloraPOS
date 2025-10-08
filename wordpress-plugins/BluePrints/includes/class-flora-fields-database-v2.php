<?php
/**
 * Flora Fields Database Class - V2 Simplified
 * Clean, simple queries with no recursion
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_Fields_Database_V2 {
    
    // ========================================
    // FIELDS
    // ========================================
    
    /**
     * Get all fields (with optional filtering)
     */
    public static function get_fields($args = []) {
        global $wpdb;
        
        $defaults = [
            'status' => 'active',
            'type' => '',
            'group' => '',
            'search' => '',
            'limit' => -1,
            'offset' => 0,
            'orderby' => 'sort_order',
            'order' => 'ASC'
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $where = ["status = %s"];
        $values = [$args['status']];
        
        if (!empty($args['type'])) {
            $where[] = "type = %s";
            $values[] = $args['type'];
        }
        
        if (!empty($args['group'])) {
            $where[] = "group_label = %s";
            $values[] = $args['group'];
        }
        
        if (!empty($args['search'])) {
            $where[] = "(name LIKE %s OR label LIKE %s OR description LIKE %s)";
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $values[] = $search_term;
            $values[] = $search_term;
            $values[] = $search_term;
        }
        
        $sql = "SELECT * FROM {$wpdb->prefix}fd_fields WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY {$args['orderby']} {$args['order']}";
        
        if ($args['limit'] > 0) {
            $sql .= " LIMIT %d OFFSET %d";
            $values[] = $args['limit'];
            $values[] = $args['offset'];
        }
        
        return $wpdb->get_results($wpdb->prepare($sql, $values));
    }
    
    /**
     * Get single field by ID
     */
    public static function get_field($field_id) {
        global $wpdb;
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}fd_fields WHERE id = %d",
            $field_id
        ));
    }
    
    /**
     * Get field by name
     */
    public static function get_field_by_name($name) {
        global $wpdb;
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}fd_fields WHERE name = %s",
            $name
        ));
    }
    
    /**
     * Create field
     */
    public static function create_field($data) {
        global $wpdb;
        
        $defaults = [
            'name' => '',
            'label' => '',
            'type' => 'text',
            'group_label' => null,
            'description' => '',
            'config' => '{}',
            'sort_order' => 0,
            'status' => 'active'
        ];
        
        $data = wp_parse_args($data, $defaults);
        
        // Ensure config is JSON
        if (is_array($data['config'])) {
            $data['config'] = json_encode($data['config']);
        }
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'fd_fields',
            $data
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    /**
     * Update field
     */
    public static function update_field($field_id, $data) {
        global $wpdb;
        
        // Ensure config is JSON
        if (isset($data['config']) && is_array($data['config'])) {
            $data['config'] = json_encode($data['config']);
        }
        
        return $wpdb->update(
            $wpdb->prefix . 'fd_fields',
            $data,
            ['id' => $field_id]
        );
    }
    
    /**
     * Delete field
     */
    public static function delete_field($field_id) {
        global $wpdb;
        
        // Delete assignments first (cascade)
        $wpdb->delete(
            $wpdb->prefix . 'fd_field_assignments',
            ['field_id' => $field_id]
        );
        
        // Delete field
        return $wpdb->delete(
            $wpdb->prefix . 'fd_fields',
            ['id' => $field_id]
        );
    }
    
    // ========================================
    // FIELD ASSIGNMENTS (Simplified!)
    // ========================================
    
    /**
     * Get fields for a product (ONE QUERY, NO RECURSION)
     */
    public static function get_product_fields($product_id) {
        global $wpdb;
        
        // Get product categories
        $category_ids = wp_get_post_terms($product_id, 'product_cat', ['fields' => 'ids']);
        
        if (empty($category_ids)) {
            $category_ids = [0]; // Dummy value to prevent SQL error
        }
        
        $placeholders = implode(',', array_fill(0, count($category_ids), '%d'));
        $params = array_merge($category_ids, [$product_id]);
        
        // ONE query to get all applicable fields
        $sql = "
            SELECT DISTINCT f.*, fa.is_required, fa.sort_order as assignment_order
            FROM {$wpdb->prefix}fd_fields f
            INNER JOIN {$wpdb->prefix}fd_field_assignments fa ON f.id = fa.field_id
            WHERE f.status = 'active'
            AND (
                (fa.assignment_type = 'global' AND fa.target_id IS NULL)
                OR (fa.assignment_type = 'category' AND fa.target_id IN ($placeholders))
                OR (fa.assignment_type = 'product' AND fa.target_id = %d)
            )
            ORDER BY fa.sort_order ASC, f.sort_order ASC, f.name ASC
        ";
        
        return $wpdb->get_results($wpdb->prepare($sql, $params));
    }
    
    /**
     * Get fields for a category
     */
    public static function get_category_fields($category_id) {
        global $wpdb;
        
        $sql = "
            SELECT DISTINCT f.*, fa.is_required, fa.sort_order as assignment_order
            FROM {$wpdb->prefix}fd_fields f
            INNER JOIN {$wpdb->prefix}fd_field_assignments fa ON f.id = fa.field_id
            WHERE f.status = 'active'
            AND (
                (fa.assignment_type = 'global' AND fa.target_id IS NULL)
                OR (fa.assignment_type = 'category' AND fa.target_id = %d)
            )
            ORDER BY fa.sort_order ASC, f.sort_order ASC, f.name ASC
        ";
        
        return $wpdb->get_results($wpdb->prepare($sql, $category_id));
    }
    
    /**
     * Create field assignment
     */
    public static function assign_field($field_id, $assignment_type, $target_id = null, $options = []) {
        global $wpdb;
        
        $defaults = [
            'is_required' => false,
            'sort_order' => 0
        ];
        
        $options = wp_parse_args($options, $defaults);
        
        // Check if already exists
        $exists = $wpdb->get_var($wpdb->prepare("
            SELECT id FROM {$wpdb->prefix}fd_field_assignments
            WHERE field_id = %d AND assignment_type = %s AND target_id <=> %s
        ", $field_id, $assignment_type, $target_id));
        
        if ($exists) {
            return $exists; // Already assigned
        }
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'fd_field_assignments',
            [
                'field_id' => $field_id,
                'assignment_type' => $assignment_type,
                'target_id' => $target_id,
                'is_required' => $options['is_required'] ? 1 : 0,
                'sort_order' => $options['sort_order']
            ]
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    /**
     * Remove field assignment
     */
    public static function unassign_field($assignment_id) {
        global $wpdb;
        
        return $wpdb->delete(
            $wpdb->prefix . 'fd_field_assignments',
            ['id' => $assignment_id]
        );
    }
    
    /**
     * Bulk assign field to multiple targets
     */
    public static function bulk_assign_field($field_id, $assignments) {
        global $wpdb;
        
        $wpdb->query('START TRANSACTION');
        
        try {
            foreach ($assignments as $assign) {
                self::assign_field(
                    $field_id,
                    $assign['type'],
                    $assign['target_id'] ?? null,
                    $assign['options'] ?? []
                );
            }
            
            $wpdb->query('COMMIT');
            return true;
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return false;
        }
    }
    
    // ========================================
    // FIELD VALUES (WordPress Post/Term Meta)
    // ========================================
    
    /**
     * Get field value for product
     */
    public static function get_product_field_value($product_id, $field_name) {
        return get_post_meta($product_id, "_fd_field_{$field_name}", true);
    }
    
    /**
     * Set field value for product
     */
    public static function set_product_field_value($product_id, $field_name, $value) {
        return update_post_meta($product_id, "_fd_field_{$field_name}", $value);
    }
    
    /**
     * Get all field values for product
     */
    public static function get_product_field_values($product_id) {
        $all_meta = get_post_meta($product_id);
        $field_values = [];
        
        foreach ($all_meta as $key => $value) {
            if (strpos($key, '_fd_field_') === 0) {
                $field_name = str_replace('_fd_field_', '', $key);
                $field_values[$field_name] = is_array($value) && count($value) === 1 ? $value[0] : $value;
            }
        }
        
        return $field_values;
    }
    
    /**
     * Get field value for category
     */
    public static function get_category_field_value($category_id, $field_name) {
        return get_term_meta($category_id, "_fd_field_{$field_name}", true);
    }
    
    /**
     * Set field value for category
     */
    public static function set_category_field_value($category_id, $field_name, $value) {
        return update_term_meta($category_id, "_fd_field_{$field_name}", $value);
    }
    
    /**
     * Delete field value
     */
    public static function delete_field_value($entity_type, $entity_id, $field_name) {
        $meta_key = "_fd_field_{$field_name}";
        
        if ($entity_type === 'product') {
            return delete_post_meta($entity_id, $meta_key);
        } elseif ($entity_type === 'category') {
            return delete_term_meta($entity_id, $meta_key);
        }
        
        return false;
    }
    
    /**
     * Get product with all field data (complete entity)
     */
    public static function get_product_with_fields($product_id) {
        $fields = self::get_product_fields($product_id);
        $values = self::get_product_field_values($product_id);
        
        $enriched_fields = [];
        
        foreach ($fields as $field) {
            $config = json_decode($field->config, true);
            
            $enriched_fields[] = [
                'id' => $field->id,
                'name' => $field->name,
                'label' => $field->label,
                'type' => $field->type,
                'group' => $field->group_label,
                'description' => $field->description,
                'is_required' => (bool)$field->is_required,
                'config' => $config,
                'value' => $values[$field->name] ?? $config['default_value'] ?? null,
                'has_value' => isset($values[$field->name])
            ];
        }
        
        return [
            'product_id' => $product_id,
            'fields' => $enriched_fields,
            'raw_values' => $values
        ];
    }
    
    // ========================================
    // PRODUCT FORMS (Pricing/Conversion)
    // ========================================
    
    /**
     * Get product forms
     */
    public static function get_product_forms($product_id) {
        global $wpdb;
        
        return $wpdb->get_results($wpdb->prepare("
            SELECT * FROM {$wpdb->prefix}fd_product_forms
            WHERE product_id = %d AND is_active = 1
            ORDER BY sort_order ASC, id ASC
        ", $product_id));
    }
    
    /**
     * Get primary form for product
     */
    public static function get_primary_product_form($product_id) {
        global $wpdb;
        
        $form = $wpdb->get_row($wpdb->prepare("
            SELECT * FROM {$wpdb->prefix}fd_product_forms
            WHERE product_id = %d AND is_primary = 1 AND is_active = 1
            LIMIT 1
        ", $product_id));
        
        // If no primary, return first active form
        if (!$form) {
            $form = $wpdb->get_row($wpdb->prepare("
                SELECT * FROM {$wpdb->prefix}fd_product_forms
                WHERE product_id = %d AND is_active = 1
                ORDER BY sort_order ASC
                LIMIT 1
            ", $product_id));
        }
        
        return $form;
    }
    
    /**
     * Create product form
     */
    public static function create_product_form($data) {
        global $wpdb;
        
        $defaults = [
            'product_id' => 0,
            'form_name' => '',
            'form_label' => '',
            'unit_type' => 'weight',
            'base_quantity' => 1.0,
            'base_unit' => 'grams',
            'base_price_cents' => 0,
            'cost_cents' => 0,
            'is_active' => 1,
            'is_primary' => 0,
            'sort_order' => 0
        ];
        
        $data = wp_parse_args($data, $defaults);
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'fd_product_forms',
            $data
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    // ========================================
    // PRICING RULES
    // ========================================
    
    /**
     * Get pricing rules
     */
    public static function get_pricing_rules($args = []) {
        global $wpdb;
        
        $defaults = [
            'is_active' => true,
            'rule_type' => '',
            'limit' => -1
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $where = [];
        $values = [];
        
        if ($args['is_active'] !== null) {
            $where[] = "is_active = %d";
            $values[] = $args['is_active'] ? 1 : 0;
        }
        
        if (!empty($args['rule_type'])) {
            $where[] = "rule_type = %s";
            $values[] = $args['rule_type'];
        }
        
        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $sql = "SELECT * FROM {$wpdb->prefix}fd_pricing_rules $where_clause ORDER BY priority ASC";
        
        if ($args['limit'] > 0) {
            $sql .= " LIMIT %d";
            $values[] = $args['limit'];
        }
        
        if (!empty($values)) {
            return $wpdb->get_results($wpdb->prepare($sql, $values));
        }
        
        return $wpdb->get_results($sql);
    }
    
    // ========================================
    // RECIPES
    // ========================================
    
    /**
     * Get recipes
     */
    public static function get_recipes($args = []) {
        global $wpdb;
        
        $defaults = [
            'is_active' => true,
            'category_id' => null,
            'type' => ''
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $where = ["is_active = %d"];
        $values = [$args['is_active'] ? 1 : 0];
        
        if ($args['category_id']) {
            $where[] = "output_category_id = %d";
            $values[] = $args['category_id'];
        }
        
        if (!empty($args['type'])) {
            $where[] = "recipe_type = %s";
            $values[] = $args['type'];
        }
        
        $sql = "SELECT * FROM {$wpdb->prefix}fd_recipes WHERE " . implode(' AND ', $where);
        
        return $wpdb->get_results($wpdb->prepare($sql, $values));
    }
    
    /**
     * Get recipe with ingredients
     */
    public static function get_recipe_with_ingredients($recipe_id) {
        global $wpdb;
        
        $recipe = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}fd_recipes WHERE id = %d",
            $recipe_id
        ));
        
        if (!$recipe) {
            return null;
        }
        
        $ingredients = $wpdb->get_results($wpdb->prepare("
            SELECT * FROM {$wpdb->prefix}fd_recipe_ingredients
            WHERE recipe_id = %d
            ORDER BY sort_order ASC
        ", $recipe_id));
        
        $recipe->ingredients = $ingredients;
        
        return $recipe;
    }
}

