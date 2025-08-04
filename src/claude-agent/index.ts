// Claude Agent Entry Point - Simplified and Fixed
import { SYSTEM_PROMPT } from './prompts/system'
import { getToolDefinitions } from './schema/toolSchemas'
import { executeTool } from './tools'
import { ClaudeAgentConfig, ClaudeMessage, ToolCall, StreamController } from './types'

// API Configuration - FIXED: Use HTTPS to avoid 301 redirects  
const WOO_BASE_URL = 'https://api.floradistro.com'
const WOO_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WOO_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export class ClaudeAgent {
  private config: ClaudeAgentConfig

  constructor(config: ClaudeAgentConfig) {
    this.config = {
      ...config,
      apiConfig: {
        baseUrl: WOO_BASE_URL,
        consumerKey: WOO_CONSUMER_KEY,
        consumerSecret: WOO_CONSUMER_SECRET
      }
    }
  }

  // Main chat processing method
  async processChat(
    message: string,
    conversationHistory: ClaudeMessage[] = [],
    controller?: StreamController
  ): Promise<string> {
    try {
      if (controller) {
        return await this.processStreamingChat(message, conversationHistory, controller)
      } else {
        return await this.processSimpleChat(message, conversationHistory)
      }
    } catch (error) {
      console.error('Claude Agent error:', error)
      throw error
    }
  }

  // Simple non-streaming chat
  private async processSimpleChat(message: string, conversationHistory: ClaudeMessage[]): Promise<string> {
    const messages = this.buildMessages(conversationHistory, message)
    
    const requestBody = {
      model: 'claude-sonnet-4-20250514', // Use same model as working chat route
      max_tokens: 8000,
      temperature: 0.3,
      system: this.config.systemPrompt,
      messages: messages,
      tools: getToolDefinitions(),
      tool_choice: { type: 'any' }, // Force tool usage like working route
      stream: false
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle tool calls if present
    if (data.content) {
      let textResponse = ''
      const toolCalls = []
      
      for (const content of data.content) {
        if (content.type === 'text') {
          textResponse += content.text
        } else if (content.type === 'tool_use') {
          toolCalls.push(content)
        }
      }
      
      // Execute tools if present
      if (toolCalls.length > 0) {
        console.log(`🔧 Executing ${toolCalls.length} tool calls`)
        const toolResults = []
        
        for (const toolCall of toolCalls) {
          try {
            const result = await executeTool(toolCall.name, toolCall.input, this.config.apiConfig)
            console.log(`✅ Tool ${toolCall.name} executed successfully`)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result)
            })
          } catch (error) {
            console.error(`❌ Tool ${toolCall.name} failed:`, error)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify({ error: true, message: error instanceof Error ? error.message : String(error) })
            })
          }
        }
        
        // Get final response with tool results - format exactly like working route
        const finalMessages = [
          ...messages,
          {
            role: 'assistant',
            content: data.content  // data.content is already in correct format from Claude API
          },
          {
            role: 'user',
            content: toolResults
          }
        ]
        
        const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            temperature: 0.3,
            system: this.config.systemPrompt,
            messages: finalMessages,
            stream: false
            // Note: No tools parameter for final analysis like working route
          })
        })
        
        if (finalResponse.ok) {
          const finalData = await finalResponse.json()
          return finalData.content[0]?.text || textResponse
        }
      }
      
      return textResponse || 'No response'
    }
    
    return 'No response'
  }

  // Streaming chat (simplified version of working route)
  private async processStreamingChat(
    message: string, 
    conversationHistory: ClaudeMessage[], 
    controller: StreamController
  ): Promise<string> {
    const encoder = new TextEncoder()
    const messages = this.buildMessages(conversationHistory, message)
    let allMessages = [...messages]
    let totalToolCalls = 0
    const maxRounds = 3
    
    try {
      // Allow multiple rounds like working route
      for (let round = 0; round < maxRounds; round++) {
        const requestBody = {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          temperature: 0.3,
          system: this.config.systemPrompt,
          messages: allMessages,
          tools: getToolDefinitions(),
          tool_choice: round <= 1 ? { type: 'any' } : { type: 'auto' }, // Force tools early
          stream: true
        }

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        })

        if (!claudeResponse.ok) {
          throw new Error(`Claude API error: ${claudeResponse.status}`)
        }

        // Process streaming response
        const reader = claudeResponse.body?.getReader()
        if (!reader) throw new Error('No response body')
        
        const decoder = new TextDecoder()
        let buffer = ''
        let assistantResponse = ''
        const toolCalls = []
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') break
              
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                  toolCalls.push(parsed.content_block)
                  controller.enqueue(encoder.encode(`data: {"type": "text", "content": "🔧 Using ${parsed.content_block.name}...\\n"}\n\n`))
                } else if (parsed.type === 'content_block_delta') {
                  if (parsed.delta?.text) {
                    assistantResponse += parsed.delta.text
                    controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
                  } else if (parsed.delta?.partial_json) {
                    const lastTool = toolCalls[toolCalls.length - 1]
                    if (lastTool) {
                      if (!lastTool._inputBuffer) lastTool._inputBuffer = ''
                      lastTool._inputBuffer += parsed.delta.partial_json
                    }
                  }
                } else if (parsed.type === 'content_block_stop') {
                  const lastTool = toolCalls[toolCalls.length - 1]
                  if (lastTool && lastTool._inputBuffer) {
                    try {
                      lastTool.input = JSON.parse(lastTool._inputBuffer)
                      delete lastTool._inputBuffer
                    } catch (e) {
                      console.error('Failed to parse tool input:', e)
                    }
                  }
                }
              } catch (e) {
                // Skip parsing errors
              }
            }
          }
        }
        
        // Execute tool calls if any
        if (toolCalls.length > 0) {
          totalToolCalls += toolCalls.length
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n🚀 Executing ${toolCalls.length} API calls...\\n"}\n\n`))
          
          const toolResults = await this.executeToolCalls(toolCalls, controller, encoder)
          
          // Format content exactly like working route
          const claudeContent = []
          if (assistantResponse) {
            claudeContent.push({ type: 'text', text: assistantResponse })
          }
          for (const tool of toolCalls) {
            claudeContent.push({
              type: 'tool_use',
              id: tool.id,
              name: tool.name,
              input: tool.input
            })
          }
          
          // Add to conversation exactly like working route
          allMessages.push({
            role: 'assistant',
            content: assistantResponse || 'Using tools to gather data...'
          })
          allMessages.push({
            role: 'user',
            content: JSON.stringify(toolResults)
          })
          
          // Continue if we need more data
          if (totalToolCalls < 5 && round < maxRounds - 1) {
            continue
          }
        } else if (totalToolCalls === 0 && round === 0) {
          // Force more tool usage
          allMessages.push({
            role: 'assistant',
            content: assistantResponse || 'I need to gather data.'
          })
          allMessages.push({
            role: 'user',
            content: 'Use tools to gather real data from the API before providing analysis.'
          })
          continue
        }
        
        break
      }
      
      // Get final analysis if needed
      if (allMessages[allMessages.length - 1].role === 'user') {
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n📊 Analyzing gathered data...\\n\\n"}\n\n`))
        
        const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            temperature: 0.3,
            system: this.config.systemPrompt,
            messages: allMessages,
            stream: true
            // Note: No tools parameter for final analysis - matches working route
          })
        })
        
        if (finalResponse.ok) {
          const reader = finalResponse.body?.getReader()
          if (reader) {
            const decoder = new TextDecoder()
            let buffer = ''
            
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()
                  if (data === '[DONE]') continue
                  
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
                    }
                  } catch (e) {
                    // Skip parsing errors
                  }
                }
              }
            }
          }
        }
      }
      
      return 'Streaming response completed'
    } catch (error) {
      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ Error: ${error instanceof Error ? error.message : String(error)}"}\n\n`))
      throw error
    }
  }

  // Execute tool calls with streaming feedback
  private async executeToolCalls(toolCalls: ToolCall[], controller: StreamController, encoder: TextEncoder) {
    const toolResults = []
    
    for (const toolCall of toolCalls) {
      try {
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "⏳ Executing ${toolCall.name}...\\n"}\n\n`))
        
        const result = await executeTool(toolCall.name, toolCall.input, this.config.apiConfig)
        
        let statusMessage = `✅ ${toolCall.name}: Success`
        if (result.success && result.count !== undefined) {
          statusMessage += ` - ${result.count} items`
        }
        
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "${statusMessage}\\n"}\n\n`))
        
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        })
        
      } catch (error) {
        const errorMessage = `❌ ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "${errorMessage}\\n"}\n\n`))
        
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify({ error: true, message: error instanceof Error ? error.message : String(error) })
        })
      }
    }
    
    return toolResults
  }

  // Build message array for Claude API
  private buildMessages(history: ClaudeMessage[], userMessage: string): ClaudeMessage[] {
    const messages: ClaudeMessage[] = []
    
    // Add conversation history
    history.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    })
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    })
    
    return messages
  }
}

// Factory function to create Claude Agent
export function createClaudeAgent(): ClaudeAgent {
  const config: ClaudeAgentConfig = {
    apiConfig: {
      baseUrl: WOO_BASE_URL,
      consumerKey: WOO_CONSUMER_KEY,
      consumerSecret: WOO_CONSUMER_SECRET
    },
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    systemPrompt: SYSTEM_PROMPT,
    maxToolCalls: 8,
    streamingEnabled: true
  }

  return new ClaudeAgent(config)
}

// Export types and utilities
export * from './types'
export * from './tools'
export * from './schema/toolSchemas'