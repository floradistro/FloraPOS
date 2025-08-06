/**
 * WooCommerce Tools - ClaudePlug 3 Integration
 * This file provides the tool definitions that are imported by the schema
 */

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Get tool definitions in Claude format using ClaudePlug 3
 */
export function getToolDefinitions(): ToolSchema[] {
  // Return empty array for now since ClaudePlug 3 integration is not available
  return [];
}

// Export placeholder for backward compatibility
export function getClaudePlug3ToolsFormat(): ToolSchema[] {
  return [];
}

export { getClaudePlug3ToolsFormat as getClaudeToolsFormat };