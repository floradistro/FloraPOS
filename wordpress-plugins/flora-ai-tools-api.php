<?php
/**
 * Plugin Name: Flora AI Tools API Extension
 * Description: Adds tool endpoints for Next.js AI proxy
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register tool API endpoints
 */
add_action('rest_api_init', function() {
    // Get tools endpoint
    register_rest_route('flora-im/v1', '/ai/tools', array(
        'methods' => 'GET',
        'callback' => 'flora_ai_get_tools',
        'permission_callback' => '__return_true',
    ));
    
    // Execute tool endpoint  
    register_rest_route('flora-im/v1', '/ai/tools/execute', array(
        'methods' => 'POST',
        'callback' => 'flora_ai_execute_tool',
        'permission_callback' => '__return_true',
    ));
});

/**
 * Get available tools
 */
function flora_ai_get_tools($request) {
    try {
        // Check if Magic2 plugin is active
        if (!class_exists('Flora_AI_Tools')) {
            return new WP_Error('tools_unavailable', 'Flora AI Tools class not found', array('status' => 500));
        }
        
        $tools_class = new Flora_AI_Tools();
        $tools = $tools_class->get_tools_definition();
        
        return rest_ensure_response(array(
            'success' => true,
            'tools' => $tools,
            'count' => count($tools),
        ));
    } catch (Exception $e) {
        return new WP_Error('tools_error', $e->getMessage(), array('status' => 500));
    }
}

/**
 * Execute a tool
 */
function flora_ai_execute_tool($request) {
    try {
        $params = $request->get_json_params();
        $tool_name = isset($params['tool_name']) ? $params['tool_name'] : '';
        $tool_input = isset($params['tool_input']) ? $params['tool_input'] : array();
        
        if (empty($tool_name)) {
            return new WP_Error('invalid_tool', 'Tool name is required', array('status' => 400));
        }
        
        // Check if Magic2 plugin is active
        if (!class_exists('Flora_AI_Tools')) {
            return new WP_Error('tools_unavailable', 'Flora AI Tools class not found', array('status' => 500));
        }
        
        error_log("🔧 [Flora AI Tools API] Executing tool: $tool_name");
        
        $tools_class = new Flora_AI_Tools();
        $result = $tools_class->execute_tool($tool_name, $tool_input);
        
        return rest_ensure_response(array(
            'success' => true,
            'tool' => $tool_name,
            'result' => $result,
        ));
    } catch (Exception $e) {
        error_log("❌ [Flora AI Tools API] Tool execution error: " . $e->getMessage());
        return new WP_Error('tool_execution_error', $e->getMessage(), array('status' => 500));
    }
}



