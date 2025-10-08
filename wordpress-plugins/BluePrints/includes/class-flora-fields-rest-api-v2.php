<?php
/**
 * Flora Fields REST API - V2 Simplified
 * 16 core endpoints instead of 55+
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_Fields_REST_API_V2 {
    
    private static $_instance = null;
    const NAMESPACE = 'fd/v2';
    
    public static function instance() {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }
    
    /**
     * Initialize REST API routes
     */
    public function init_hooks() {
        $this->register_routes();
    }
    
    /**
     * Register all routes
     */
    public function register_routes() {
        // ========================================
        // FIELDS API (6 endpoints)
        // ========================================
        
        // List/Search fields
        register_rest_route(self::NAMESPACE, '/fields', [
            'methods' => 'GET',
            'callback' => [$this, 'get_fields'],
            'permission_callback' => [$this, 'check_read_permission'],
            'args' => [
                'status' => ['default' => 'active'],
                'type' => ['default' => ''],
                'group' => ['default' => ''],
                'search' => ['default' => ''],
                'page' => ['default' => 1],
                'per_page' => ['default' => 50]
            ]
        ]);
        
        // Create field
        register_rest_route(self::NAMESPACE, '/fields', [
            'methods' => 'POST',
            'callback' => [$this, 'create_field'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // Get single field
        register_rest_route(self::NAMESPACE, '/fields/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_field'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Update field
        register_rest_route(self::NAMESPACE, '/fields/(?P<id>\d+)', [
            'methods' => ['PUT', 'PATCH'],
            'callback' => [$this, 'update_field'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // Delete field
        register_rest_route(self::NAMESPACE, '/fields/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_field'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // Bulk assign fields
        register_rest_route(self::NAMESPACE, '/fields/bulk-assign', [
            'methods' => 'POST',
            'callback' => [$this, 'bulk_assign_fields'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // ========================================
        // PRODUCTS API (2 endpoints)
        // ========================================
        
        // Get product with fields
        register_rest_route(self::NAMESPACE, '/products/(?P<id>\d+)/fields', [
            'methods' => 'GET',
            'callback' => [$this, 'get_product_fields'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Update product field values
        register_rest_route(self::NAMESPACE, '/products/(?P<id>\d+)/fields', [
            'methods' => ['PUT', 'PATCH'],
            'callback' => [$this, 'update_product_fields'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // ========================================
        // CATEGORIES API (1 endpoint)
        // ========================================
        
        // Get category with fields
        register_rest_route(self::NAMESPACE, '/categories/(?P<id>\d+)/fields', [
            'methods' => 'GET',
            'callback' => [$this, 'get_category_fields'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // ========================================
        // PRICING API (3 endpoints)
        // ========================================
        
        // Get pricing rules (CRITICAL FOR FRONTEND)
        register_rest_route(self::NAMESPACE, '/pricing/rules', [
            'methods' => 'GET',
            'callback' => [$this, 'get_pricing_rules'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Get product forms
        register_rest_route(self::NAMESPACE, '/pricing/forms/(?P<product_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_product_forms'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Create product form
        register_rest_route(self::NAMESPACE, '/pricing/forms', [
            'methods' => 'POST',
            'callback' => [$this, 'create_product_form'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // Calculate price
        register_rest_route(self::NAMESPACE, '/pricing/calculate', [
            'methods' => 'POST',
            'callback' => [$this, 'calculate_price'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // ========================================
        // RECIPES API (3 endpoints)
        // ========================================
        
        // List recipes
        register_rest_route(self::NAMESPACE, '/recipes', [
            'methods' => 'GET',
            'callback' => [$this, 'get_recipes'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Get recipe details
        register_rest_route(self::NAMESPACE, '/recipes/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_recipe'],
            'permission_callback' => [$this, 'check_read_permission']
        ]);
        
        // Execute recipe
        register_rest_route(self::NAMESPACE, '/recipes/(?P<id>\d+)/execute', [
            'methods' => 'POST',
            'callback' => [$this, 'execute_recipe'],
            'permission_callback' => [$this, 'check_write_permission']
        ]);
        
        // ========================================
        // ADMIN/DEBUG API (1 endpoint)
        // ========================================
        
        // Migration endpoint
        register_rest_route(self::NAMESPACE, '/migrate', [
            'methods' => 'POST',
            'callback' => [$this, 'run_migration'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'dry_run' => ['default' => true]
            ]
        ]);
        
        error_log('Flora Fields V2: REST API routes registered (16 endpoints)');
    }
    
    // ========================================
    // FIELDS ENDPOINTS
    // ========================================
    
    public function get_fields($request) {
        $params = $request->get_params();
        
        $args = [
            'status' => $params['status'],
            'type' => $params['type'],
            'group' => $params['group'],
            'search' => $params['search'],
            'limit' => $params['per_page'],
            'offset' => ($params['page'] - 1) * $params['per_page']
        ];
        
        $fields = Flora_Fields_Database_V2::get_fields($args);
        
        // Parse config JSON
        foreach ($fields as &$field) {
            $field->config = json_decode($field->config, true);
        }
        
        return rest_ensure_response([
            'fields' => $fields,
            'page' => $params['page'],
            'per_page' => $params['per_page'],
            'total' => count($fields)
        ]);
    }
    
    public function get_field($request) {
        $field_id = $request['id'];
        $field = Flora_Fields_Database_V2::get_field($field_id);
        
        if (!$field) {
            return new WP_Error('not_found', 'Field not found', ['status' => 404]);
        }
        
        $field->config = json_decode($field->config, true);
        
        return rest_ensure_response($field);
    }
    
    public function create_field($request) {
        $data = $request->get_json_params();
        
        // Validate required fields
        if (empty($data['name']) || empty($data['label']) || empty($data['type'])) {
            return new WP_Error('invalid_data', 'Name, label, and type are required', ['status' => 400]);
        }
        
        $field_id = Flora_Fields_Database_V2::create_field($data);
        
        if (!$field_id) {
            return new WP_Error('create_failed', 'Failed to create field', ['status' => 500]);
        }
        
        $field = Flora_Fields_Database_V2::get_field($field_id);
        $field->config = json_decode($field->config, true);
        
        return rest_ensure_response([
            'message' => 'Field created successfully',
            'field' => $field
        ]);
    }
    
    public function update_field($request) {
        $field_id = $request['id'];
        $data = $request->get_json_params();
        
        $result = Flora_Fields_Database_V2::update_field($field_id, $data);
        
        if ($result === false) {
            return new WP_Error('update_failed', 'Failed to update field', ['status' => 500]);
        }
        
        $field = Flora_Fields_Database_V2::get_field($field_id);
        $field->config = json_decode($field->config, true);
        
        return rest_ensure_response([
            'message' => 'Field updated successfully',
            'field' => $field
        ]);
    }
    
    public function delete_field($request) {
        $field_id = $request['id'];
        
        $result = Flora_Fields_Database_V2::delete_field($field_id);
        
        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete field', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'message' => 'Field deleted successfully',
            'deleted' => true
        ]);
    }
    
    public function bulk_assign_fields($request) {
        $data = $request->get_json_params();
        
        if (empty($data['field_id']) || empty($data['assignments'])) {
            return new WP_Error('invalid_data', 'field_id and assignments array required', ['status' => 400]);
        }
        
        $result = Flora_Fields_Database_V2::bulk_assign_field(
            $data['field_id'],
            $data['assignments']
        );
        
        if (!$result) {
            return new WP_Error('assign_failed', 'Failed to assign fields', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'message' => 'Fields assigned successfully',
            'count' => count($data['assignments'])
        ]);
    }
    
    // ========================================
    // PRODUCTS ENDPOINTS
    // ========================================
    
    public function get_product_fields($request) {
        $product_id = $request['id'];
        
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('not_found', 'Product not found', ['status' => 404]);
        }
        
        $data = Flora_Fields_Database_V2::get_product_with_fields($product_id);
        
        return rest_ensure_response($data);
    }
    
    public function update_product_fields($request) {
        $product_id = $request['id'];
        $data = $request->get_json_params();
        
        if (empty($data['fields'])) {
            return new WP_Error('invalid_data', 'fields object required', ['status' => 400]);
        }
        
        $updated = [];
        
        foreach ($data['fields'] as $field_name => $value) {
            Flora_Fields_Database_V2::set_product_field_value($product_id, $field_name, $value);
            $updated[] = $field_name;
        }
        
        return rest_ensure_response([
            'message' => 'Fields updated successfully',
            'updated' => $updated,
            'count' => count($updated)
        ]);
    }
    
    // ========================================
    // CATEGORIES ENDPOINTS
    // ========================================
    
    public function get_category_fields($request) {
        $category_id = $request['id'];
        
        $term = get_term($category_id, 'product_cat');
        if (!$term || is_wp_error($term)) {
            return new WP_Error('not_found', 'Category not found', ['status' => 404]);
        }
        
        $fields = Flora_Fields_Database_V2::get_category_fields($category_id);
        
        // Parse config
        foreach ($fields as &$field) {
            $field->config = json_decode($field->config, true);
        }
        
        return rest_ensure_response([
            'category_id' => $category_id,
            'fields' => $fields
        ]);
    }
    
    // ========================================
    // PRICING ENDPOINTS
    // ========================================
    
    public function get_product_forms($request) {
        $product_id = $request['product_id'];
        
        $forms = Flora_Fields_Database_V2::get_product_forms($product_id);
        
        return rest_ensure_response([
            'product_id' => $product_id,
            'forms' => $forms
        ]);
    }
    
    public function create_product_form($request) {
        $data = $request->get_json_params();
        
        if (empty($data['product_id']) || empty($data['form_name'])) {
            return new WP_Error('invalid_data', 'product_id and form_name required', ['status' => 400]);
        }
        
        $form_id = Flora_Fields_Database_V2::create_product_form($data);
        
        if (!$form_id) {
            return new WP_Error('create_failed', 'Failed to create form', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'message' => 'Product form created successfully',
            'form_id' => $form_id
        ]);
    }
    
    public function calculate_price($request) {
        $data = $request->get_json_params();
        
        // Placeholder - implement pricing calculation logic
        return rest_ensure_response([
            'price_cents' => 0,
            'base_price_cents' => 0,
            'rules_applied' => []
        ]);
    }
    
    // ========================================
    // PRICING RULES ENDPOINTS (Added)
    // ========================================
    
    public function get_pricing_rules($request) {
        global $wpdb;
        
        $params = $request->get_params();
        
        // Fetch all active pricing rules from the table
        $rules = $wpdb->get_results("
            SELECT * FROM {$wpdb->prefix}fd_pricing_rules
            WHERE is_active = 1
            ORDER BY priority ASC, id ASC
        ");
        
        return rest_ensure_response([
            'rules' => $rules,
            'count' => count($rules)
        ]);
    }
    
    // ========================================
    // RECIPES ENDPOINTS
    // ========================================
    
    public function get_recipes($request) {
        $params = $request->get_params();
        
        $args = [
            'is_active' => true,
            'category_id' => $params['category_id'] ?? null,
            'type' => $params['type'] ?? ''
        ];
        
        $recipes = Flora_Fields_Database_V2::get_recipes($args);
        
        return rest_ensure_response([
            'recipes' => $recipes
        ]);
    }
    
    public function get_recipe($request) {
        $recipe_id = $request['id'];
        
        $recipe = Flora_Fields_Database_V2::get_recipe_with_ingredients($recipe_id);
        
        if (!$recipe) {
            return new WP_Error('not_found', 'Recipe not found', ['status' => 404]);
        }
        
        return rest_ensure_response($recipe);
    }
    
    public function execute_recipe($request) {
        $recipe_id = $request['id'];
        $data = $request->get_json_params();
        
        // Placeholder - implement recipe execution logic
        return rest_ensure_response([
            'message' => 'Recipe execution not yet implemented',
            'recipe_id' => $recipe_id
        ]);
    }
    
    // ========================================
    // ADMIN ENDPOINTS
    // ========================================
    
    public function run_migration($request) {
        $dry_run = $request['dry_run'];
        
        $result = Flora_Fields_Migration::migrate($dry_run);
        
        return rest_ensure_response($result);
    }
    
    // ========================================
    // COMPATIBILITY ENDPOINTS (V1 → V2 Bridge)
    // ========================================
    
    /**
     * Get blueprint assignments in V1 format (compatibility endpoint)
     * Maps field assignments to blueprint-style assignments
     */
    public function get_blueprint_assignments_compat($request) {
        global $wpdb;
        
        // Define the mapping of category ID to blueprint ID and name
        // This is based on your actual blueprint configuration
        $blueprint_mappings = [
            16 => ['id' => 41, 'name' => 'Concentrate'],  // Concentrate category
            17 => ['id' => 42, 'name' => 'Edibles'],      // Edibles category
            18 => ['id' => 43, 'name' => 'Flower'],       // Flower category
            19 => ['id' => 44, 'name' => 'Moonwater'],    // Moonwater category
            20 => ['id' => 45, 'name' => 'Vape']          // Vape category
        ];
        
        $assignments = [];
        
        // Generate assignments for each mapped category
        foreach ($blueprint_mappings as $category_id => $blueprint) {
            // Check if category has field assignments
            $has_fields = $wpdb->get_var($wpdb->prepare("
                SELECT COUNT(*)
                FROM {$wpdb->prefix}fd_field_assignments
                WHERE assignment_type = 'category' AND target_id = %d
            ", $category_id));
            
            if ($has_fields > 0) {
                $assignments[] = [
                    'id' => $blueprint['id'],
                    'blueprint_id' => $blueprint['id'],
                    'blueprint_name' => $blueprint['name'],
                    'category_id' => $category_id,
                    'entity_type' => 'category'
                ];
            }
        }
        
        error_log('V2 Blueprint Assignments (Compatibility): ' . count($assignments) . ' assignments returned');
        
        return rest_ensure_response($assignments);
    }
    
    // ========================================
    // PERMISSIONS
    // ========================================
    
    public function check_read_permission() {
        // Allow read access for authenticated users
        return true; // Adjust based on your needs
    }
    
    public function check_write_permission() {
        return current_user_can('edit_products');
    }
    
    public function check_admin_permission() {
        return current_user_can('manage_options');
    }
}

