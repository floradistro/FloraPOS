// Central tool executor with caching and error handling
import { executeTool } from './index'
import { toolLogger, ToolExecutionStats } from '../utils/claudeAPI'

// Tool result cache
const toolResultCache = new Map<string, any>()
const cacheExpiry = new Map<string, number>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(toolName: string, input: any): string {
  return `${toolName}:${JSON.stringify(input)}`
}

function isCacheValid(key: string): boolean {
  const expiry = cacheExpiry.get(key)
  if (!expiry) return false
  return Date.now() < expiry
}

function setCacheResult(key: string, result: any) {
  toolResultCache.set(key, result)
  cacheExpiry.set(key, Date.now() + CACHE_TTL)
  
  // Clean expired entries
  cleanExpiredCache()
}

function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, expiry] of cacheExpiry.entries()) {
    if (now >= expiry) {
      toolResultCache.delete(key)
      cacheExpiry.delete(key)
    }
  }
}

export interface ToolExecutionConfig {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
}

export interface ToolExecutionResult {
  success: boolean
  result?: any
  error?: string
  duration: number
  cached: boolean
}

export async function executeToolWithCache(
  toolName: string,
  input: any,
  config: ToolExecutionConfig,
  timeoutMs = 15000
): Promise<ToolExecutionResult> {
  const startTime = Date.now()
  const cacheKey = getCacheKey(toolName, input)

  // Check cache first
  if (toolResultCache.has(cacheKey) && isCacheValid(cacheKey)) {
    const result = toolResultCache.get(cacheKey)
    const duration = Date.now() - startTime
    
    // Log cache hit
    toolLogger.log({
      toolName,
      duration,
      success: true,
      cached: true,
      timestamp: new Date()
    })
    
    console.log(`🚀 Cache hit for: ${toolName}`, input)
    return {
      success: true,
      result,
      duration,
      cached: true
    }
  }

  // Execute tool
  try {
    console.log(`🔧 Executing: ${toolName}`, input)
    
    const result = await Promise.race([
      executeTool(toolName, input, config),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tool timeout')), timeoutMs)
      )
    ])

    const duration = Date.now() - startTime

    // Cache successful results
    setCacheResult(cacheKey, result)
    
    // Log execution
    toolLogger.log({
      toolName,
      duration,
      success: true,
      cached: false,
      timestamp: new Date()
    })

    console.log(`✅ Tool completed: ${toolName} in ${duration}ms`)
    return {
      success: true,
      result,
      duration,
      cached: false
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Tool failed'
    
    // Log failure
    toolLogger.log({
      toolName,
      duration,
      success: false,
      cached: false,
      timestamp: new Date()
    })

    console.error(`❌ Tool failed: ${toolName} - ${errorMsg}`)
    return {
      success: false,
      error: errorMsg,
      duration,
      cached: false
    }
  }
}

// Tool registry for dynamic loading
export interface ToolDefinition {
  name: string
  description: string
  parameters: any
  handler: (input: any, config: ToolExecutionConfig) => Promise<any>
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  list(): string[] {
    return Array.from(this.tools.keys())
  }

  async execute(name: string, input: any, config: ToolExecutionConfig): Promise<any> {
    const tool = this.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }
    return await tool.handler(input, config)
  }
}

export const toolRegistry = new ToolRegistry()

// Performance monitoring
export function getToolPerformanceReport(): any {
  const stats = toolLogger.getStats()
  const toolNames = [...new Set(stats.map(s => s.toolName))]
  
  return toolNames.map(name => ({
    tool: name,
    totalExecutions: toolLogger.getStats(name).length,
    averageTime: toolLogger.getAverageExecutionTime(name),
    cacheHitRate: toolLogger.getCacheHitRate(name),
    successRate: toolLogger.getStats(name).filter(s => s.success).length / toolLogger.getStats(name).length
  }))
}

// Cache management
export function clearToolCache() {
  toolResultCache.clear()
  cacheExpiry.clear()
  console.log('🧹 Tool cache cleared')
}

export function getCacheStats() {
  return {
    size: toolResultCache.size,
    keys: Array.from(toolResultCache.keys())
  }
}