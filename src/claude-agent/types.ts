// Type definitions for Claude Agent

export interface ApiConfig {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
}

export interface WooCommerceTool {
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  buildUrl: (params: any) => string
  buildBody?: (params: any) => any
  execute: (params: any, apiConfig: ApiConfig) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  data: any
  count: number
  error?: string
  metrics?: Record<string, any>
  productIds?: number[]
  locationIds?: number[]
  locationNames?: string[]
}

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolCall {
  id: string
  name: string
  input: any
  _inputBuffer?: string // For accumulating partial JSON during streaming
}

export interface StreamController {
  enqueue: (chunk: Uint8Array) => void
  close: () => void
}

export interface ClaudeAgentConfig {
  apiConfig: ApiConfig
  anthropicApiKey: string
  systemPrompt: string
  maxToolCalls: number
  streamingEnabled: boolean
}