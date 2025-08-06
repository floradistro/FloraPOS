/**
 * WooCommerce Tools - ClaudePlug 3 Integration
 * This file provides the tool definitions that are imported by the schema
 */

import { getClaudePlug3ToolsFormat } from '@/claude-agent/tools/definitions-claudeplug3';

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
  return getClaudePlug3ToolsFormat();
}

// Export for backward compatibility
export { getClaudePlug3ToolsFormat as getClaudeToolsFormat };