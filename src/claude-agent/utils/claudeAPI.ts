// Claude API utilities for improved streaming and tool management
import { getToolDefinitions } from '@/lib/woocommerce-tools'

interface ClaudeMessage {
  role: 'user' | 'assistant' | 'tool'
  content: any
}

interface ClaudeStreamChunk {
  type: string
  delta?: {
    text?: string
    partial_json?: string
  }
  content_block?: {
    type: string
    id: string
    name: string
  }
  stop_reason?: string
}

export class ClaudeAPIManager {
  private apiKey: string
  private baseUrl = 'https://api.anthropic.com/v1/messages'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async *streamClaudeMessage(
    messages: ClaudeMessage[], 
    systemPrompt: string,
    maxTokens = 4000
  ): AsyncGenerator<ClaudeStreamChunk> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        tools: getToolDefinitions(),
        temperature: 0.1,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const data = line.slice(6).trim()
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            yield parsed
          } catch (e) {
            // Skip malformed JSON
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// Tool execution statistics
export interface ToolExecutionStats {
  toolName: string
  duration: number
  success: boolean
  cached: boolean
  timestamp: Date
}

export class ToolExecutionLogger {
  private stats: ToolExecutionStats[] = []
  private maxLogSize = 1000

  log(stats: ToolExecutionStats) {
    this.stats.push(stats)
    
    // Keep log size manageable
    if (this.stats.length > this.maxLogSize) {
      this.stats = this.stats.slice(-this.maxLogSize + 100)
    }
  }

  getStats(toolName?: string): ToolExecutionStats[] {
    if (toolName) {
      return this.stats.filter(s => s.toolName === toolName)
    }
    return this.stats
  }

  getAverageExecutionTime(toolName: string): number {
    const toolStats = this.getStats(toolName)
    if (toolStats.length === 0) return 0
    
    const totalTime = toolStats.reduce((sum, stat) => sum + stat.duration, 0)
    return totalTime / toolStats.length
  }

  getCacheHitRate(toolName: string): number {
    const toolStats = this.getStats(toolName)
    if (toolStats.length === 0) return 0
    
    const cachedCount = toolStats.filter(s => s.cached).length
    return cachedCount / toolStats.length
  }
}

// Global logger instance
export const toolLogger = new ToolExecutionLogger()