import { NextRequest, NextResponse } from 'next/server'
import { wooTools, getToolDefinitions } from '@/lib/woocommerce-tools'

// API Configuration
const WOO_BASE_URL = process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com'
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are a helpful business intelligence assistant for Flora Distro cannabis dispensary. You have access to real-time data and should respond naturally like a knowledgeable human colleague would.

CRITICAL: Do NOT use any markdown formatting in your responses. This means no asterisks, no hash symbols, no bullet points, no emojis, no symbols, and no structured formatting whatsoever. Write in plain natural text like you are speaking to someone in person.

Always use real data from the tools, never make up numbers or information. Use multiple tools to gather comprehensive context before providing analysis.

For efficiency, prioritize bulk endpoints when possible. Use bulk_get_inventory instead of multiple individual calls. Use get_products to get product IDs first, then bulk_get_inventory for inventory data.

For location analysis, use get_products then bulk_get_inventory with location filters. For multi-location comparison, use get_products then get_multi_location_stock.

The location IDs you'll need are Charlotte Monroe (30), Salisbury (31), Chesterfield (34), and Bon Air (35).

Approach each request by first gathering data through appropriate tools, then providing clear analysis in conversational language. If your first approach doesn't give sufficient data, try alternative tools or broader searches.

Keep responses conversational and helpful, like you're talking to a colleague who asked you to look something up. Write in normal sentences without any special formatting.

BULK ENDPOINT USAGE:
- bulk_get_inventory: Get inventory for multiple products (up to 100)
- bulk_update_stock: Update multiple inventory items (up to 50)
- get_location_inventory_summary: Get all inventory for a specific location
- get_multi_location_stock: Get stock across all locations for products

API GUIDELINES:
- Default to per_page: 50 for products to get more IDs for bulk operations
- Known locations: Charlotte Monroe (ID: 30), others via get_locations
- Use bulk endpoints whenever dealing with multiple products/inventory items
- Chain efficiently: get_products → bulk_get_inventory → analyze

Your responses must be 100% based on real API data using the most efficient bulk endpoints available.`

// Execute WooCommerce API calls with retry logic
async function executeWooCommerceTool(toolName: string, parameters: any, retryCount = 0): Promise<any> {
  const tool = wooTools[toolName]
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64')
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Flora-AI-Assistant/1.0'
  }

  try {
    // Build the full URL
    const urlSuffix = tool.buildUrl(parameters)
    const url = `${WOO_BASE_URL}${tool.endpoint}${urlSuffix}`
    
    // Build request options
    const options: RequestInit = {
      method: tool.method,
      headers,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    }

    // Add body for POST/PUT requests
    if (tool.buildBody && (tool.method === 'POST' || tool.method === 'PUT')) {
      options.body = JSON.stringify(tool.buildBody(parameters))
    }

    console.log(`🔄 Executing ${toolName}: ${tool.method} ${url} (attempt ${retryCount + 1})`)
    
    const response = await fetch(url, options)
    const responseText = await response.text()

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}: ${responseText}`)
      
      // Parse error details if possible
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson.message || errorJson.error || responseText
      } catch (e) {
        // Keep original text if not JSON
      }

      return {
        error: true,
        status: response.status,
        message: `${response.status} ${response.statusText}`,
        details: errorDetails
      }
    }

    // Parse successful response
    const data = JSON.parse(responseText)
    const itemCount = Array.isArray(data) ? data.length : (data ? 1 : 0)
    console.log(`✅ Success: Received ${itemCount} item(s)`)
    
    // Special handling for empty results
    if (itemCount === 0 && toolName === 'get_location_stock') {
      return {
        success: true,
        data,
        count: 0,
        message: 'No inventory found for this location. The location may not exist or has no stock assigned.'
      }
    }
    
    return {
      success: true,
      data,
      count: itemCount
    }

  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        // Retry on timeout with reduced parameters
        if (retryCount < 1 && toolName === 'get_products') {
          console.log(`⏱️ Timeout occurred, retrying with fewer items...`)
          const reducedParams = { ...parameters, per_page: 5 }
          return executeWooCommerceTool(toolName, reducedParams, retryCount + 1)
        }
        
        return {
          error: true,
          message: 'Request timeout',
          details: 'The API is responding slowly. Try requesting fewer items or narrowing your search.'
        }
      }
      
      return {
        error: true,
        message: 'Request failed',
        details: error.message
      }
    }
    
    return {
      error: true,
      message: 'Unknown error occurred'
    }
  }
}

// Format messages for Claude API
function formatMessages(conversationHistory: any[], userMessage: string) {
  const messages = []
  
  // Include recent conversation history
  if (conversationHistory.length > 0) {
    messages.push(...conversationHistory.slice(-10))
  }
  
  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage
  })
  
  return messages
}

// Smooth streaming utility
async function smoothStream(controller: any, encoder: TextEncoder, text: string, delay: number = 12) {
  // For bullet points and status messages, send line by line quickly
  if (text.includes('•') || text.startsWith('✅') || text.startsWith('❌') || text.startsWith('⏱️')) {
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(text)}}\n\n`))
    await new Promise(resolve => setTimeout(resolve, 50))
    return
  }
  
  // For headers with **, stream the whole line but with a pause after
  if (text.includes('**')) {
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(text)}}\n\n`))
    await new Promise(resolve => setTimeout(resolve, 100))
    return
  }
  
  // For regular text, stream character by character for smooth effect
  const chunks = text.match(/.{1,3}|./g) || [] // Group 3 chars at a time for smoother streaming
  for (let i = 0; i < chunks.length; i++) {
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(chunks[i])}}\n\n`))
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Execute tool calls and return results
async function executeToolCalls(toolCalls: any[], controller: any, encoder: TextEncoder, round: number = 0) {
  // Simple execution start message
  if (toolCalls.length > 0) {
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n🚀 **Executing ${toolCalls.length} API call(s)**...\\n\\n"}\n\n`))
  }
  
  const toolResults = []
  
  // Group tools that can be executed in parallel
  const parallelGroups: any[][] = []
  let currentGroup: any[] = []
  
  for (const toolCall of toolCalls) {
    // Tools that depend on results from others should be in separate groups
    if (toolCall.name.includes('location_stock') && currentGroup.some(t => t.name === 'get_locations')) {
      parallelGroups.push([...currentGroup])
      currentGroup = [toolCall]
    } else {
      currentGroup.push(toolCall)
    }
  }
  if (currentGroup.length > 0) {
    parallelGroups.push(currentGroup)
  }

  // Execute each group
  for (let groupIndex = 0; groupIndex < parallelGroups.length; groupIndex++) {
    const group = parallelGroups[groupIndex]
    
    if (group.length > 1) {
      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "⚡ Running ${group.length} tools in parallel (group ${groupIndex + 1}/${parallelGroups.length})...\\n"}\n\n`))
    }
    
    // Execute tools in parallel within each group
    const groupPromises = group.map(async (toolCall) => {
      const result = await executeWooCommerceTool(toolCall.name, toolCall.input)
      
      return {
        toolCall,
        result,
        toolResult: {
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        }
      }
    })
    
    const groupResults = await Promise.all(groupPromises)
    
          // Process results and show status with insights
      for (const { toolCall, result, toolResult } of groupResults) {
        toolResults.push(toolResult)
        
        const toolDisplayName = toolCall.name.replace(/_/g, ' ')
        if (result.error) {
          if (result.message.includes('timeout')) {
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "⏱️ ${toolDisplayName}: Timeout - ${result.details}\\n"}\n\n`))
          } else {
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ ${toolDisplayName}: ${result.message}\\n"}\n\n`))
          }
        } else {
          const itemCount = result.count || 0
          let statusMessage = `✅ ${toolDisplayName}: ${itemCount} item(s)`
          
          // Add insights based on the tool and results
          if (toolCall.name === 'get_locations' && result.data) {
            const locationNames = result.data.map((loc: any) => loc.name || `Location ${loc.id}`).slice(0, 3).join(', ')
            const more = result.data.length > 3 ? ` and ${result.data.length - 3} more` : ''
            statusMessage += ` - Found: ${locationNames}${more}`
          } else if (toolCall.name === 'get_products' && result.data && itemCount > 0) {
            const sample = result.data[0]
            statusMessage += ` - Sample: "${sample.name}" ($${sample.price})`
          } else if (toolCall.name === 'get_location_stock' && itemCount > 0) {
            statusMessage += ` at location ${toolCall.input.location_id}`
          } else if (toolCall.name === 'bulk_get_inventory' && result.data) {
            const productCount = Object.keys(result.data).length
            const totalInventoryItems = Object.values(result.data).reduce((sum: number, inventories: any) => 
              sum + (Array.isArray(inventories) ? inventories.length : 0), 0)
            statusMessage += ` - ${productCount} products, ${totalInventoryItems} inventory records`
            if (toolCall.input.location_id) {
              statusMessage += ` at location ${toolCall.input.location_id}`
            } else {
              statusMessage += ` across all locations`
            }
          } else if (toolCall.name === 'bulk_update_stock' && result.data) {
            const successCount = result.data.successful_updates || 0
            const totalCount = result.data.total_updates || 0
            statusMessage += ` - ${successCount}/${totalCount} updates successful`
            if (result.data.errors && result.data.errors.length > 0) {
              statusMessage += `, ${result.data.errors.length} errors`
            }
          } else if (toolCall.name === 'get_multi_location_stock' && result.data) {
            const productCount = Object.keys(result.data).length
            const locationSet = new Set()
            Object.values(result.data).forEach((inventories: any) => {
              if (Array.isArray(inventories)) {
                inventories.forEach((inv: any) => locationSet.add(inv.location_name))
              }
            })
            statusMessage += ` - ${productCount} products across ${locationSet.size} locations`
          } else if (toolCall.name === 'get_location_inventory_summary' && result.data) {
            const productCount = Object.keys(result.data).length
            statusMessage += ` - ${productCount} products with inventory`
          }
          
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "${statusMessage}\\n"}\n\n`))
        }
      }
  }
  
  return toolResults
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json()
    
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          // Build conversation
          const messages = formatMessages(conversation_history, message)
          const tools = getToolDefinitions()

          // Keep track of all messages for context
          let allMessages = [...messages]
          let totalToolCalls = 0
          const maxRounds = 5 // Maximum rounds of tool calls
          
          // Allow multiple rounds of tool calls
          for (let round = 0; round < maxRounds; round++) {
            // Call Claude API with streaming
            const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 8000,
              system: SYSTEM_PROMPT,
                messages: allMessages,
                tools,
                tool_choice: round <= 1 ? { type: 'any' } : { type: 'auto' },  // Force tools on first two rounds
                temperature: 0.3,
                stream: true  // Enable streaming
              })
            })

            if (!claudeResponse.ok) {
              const errorText = await claudeResponse.text()
              console.error(`Claude API error: ${claudeResponse.status} - ${errorText}`)
              throw new Error(`Claude API error: ${claudeResponse.statusText}`)
            }

            // Process streaming response
            const reader = claudeResponse.body?.getReader()
            if (!reader) throw new Error('No response body')
            
            const decoder = new TextDecoder()
            let buffer = ''
            let assistantResponse = ''
            const toolCalls = []
            let currentContent: any[] = []
            
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
                    
                    if (parsed.type === 'message_start' && parsed.message?.content) {
                      currentContent = parsed.message.content
                    } else if (parsed.type === 'content_block_start') {
                      if (parsed.content_block?.type === 'tool_use') {
                        toolCalls.push(parsed.content_block)
                        // Show that AI is selecting a tool
                        if (round === 0 && toolCalls.length === 1) {
                          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n🤔 **Analyzing your request...**\\n\\n"}\n\n`))
                        }
                        const toolName = parsed.content_block.name?.replace(/_/g, ' ') || 'tool'
                        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "📌 Preparing to call: ${toolName}\\n"}\n\n`))
                      }
                    } else if (parsed.type === 'content_block_delta') {
                      if (parsed.delta?.text) {
                        assistantResponse += parsed.delta.text
                        // Always stream text as it arrives - this shows AI's thinking
                        controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
                      } else if (parsed.delta?.partial_json) {
                        // Accumulate tool input JSON
                        const lastTool: any = toolCalls[toolCalls.length - 1]
                        if (lastTool) {
                          if (!lastTool._inputBuffer) lastTool._inputBuffer = ''
                          lastTool._inputBuffer += parsed.delta.partial_json
                        }
                      }
                    } else if (parsed.type === 'content_block_stop') {
                      // Finalize tool input
                      const lastTool: any = toolCalls[toolCalls.length - 1]
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
            
            console.log(`🔍 Round ${round + 1}: Found ${toolCalls.length} tool calls, total so far: ${totalToolCalls}`)

            // If no tool calls
            if (toolCalls.length === 0) {
              // Only break if we've made sufficient tool calls or if this is a later round
              if (totalToolCalls >= 3 || round >= 2) {
                // Response was already streamed in real-time
                break
              } else {
                // Force more tool usage in early rounds
                if (assistantResponse) {
                  controller.enqueue(encoder.encode(`data: {"type": "text", "content": "⚠️ Need more data. Continuing to gather information...\\n\\n"}\n\n`))
                }
                // Add a message to prompt more tool usage
                allMessages.push({
                  role: 'assistant',
                  content: assistantResponse || 'I need to gather more data.'
                })
                allMessages.push({
                  role: 'user',
                  content: 'Continue gathering comprehensive data using more tool calls. You have only made ' + totalToolCalls + ' API calls so far. Make sure to check inventory at ALL locations and gather complete context before providing analysis.'
                })
                continue
              }
            }

            // Execute tool calls
            totalToolCalls += toolCalls.length
            
            if (round > 0) {
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n🔄 Making ${toolCalls.length} additional API call(s) for more detailed data...\\n\\n"}\n\n`))
            }
            
            const toolResults = await executeToolCalls(toolCalls, controller, encoder, round)
            
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n📊 Round ${round + 1} complete. Total API calls so far: ${totalToolCalls}\\n"}\n\n`))
            
            // Stream insights about what we learned
            if (toolResults.length > 0) {
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n💡 **Key Findings So Far**:\\n"}\n\n`))
              
              // Analyze tool results for insights
              let totalProducts = 0
              let totalLocations = 0
              let hasInventoryData = false
              
              for (const result of toolResults) {
                try {
                  const data = JSON.parse(result.content)
                  if (data.success && data.data) {
                    // Count locations
                    if (result.content.includes('get_locations')) {
                      totalLocations = data.count || 0
                      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "  • ${totalLocations} active store locations\\n"}\n\n`))
                    }
                    // Count products
                    if (result.content.includes('get_products')) {
                      totalProducts = data.count || 0
                      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "  • ${totalProducts} products in current query\\n"}\n\n`))
                    }
                    // Check for inventory
                    if (result.content.includes('location_stock')) {
                      hasInventoryData = true
                    }
                  }
                } catch (e) {
                  // Skip parsing errors
                }
              }
              
              if (hasInventoryData) {
                controller.enqueue(encoder.encode(`data: {"type": "text", "content": "  • Gathered inventory data across locations\\n"}\n\n`))
              }
              
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n"}\n\n`))
            }
            
            // Reconstruct Claude's response for conversation history
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
            
            // Add Claude's response and tool results to conversation
            allMessages.push({
              role: 'assistant',
              content: claudeContent
            })
            allMessages.push({
              role: 'user',
              content: toolResults
            })
            
            // If we've made 25+ tool calls total, stop
            if (totalToolCalls >= 25) {
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": "⚠️ Reached maximum of 25 API calls. Finalizing analysis...\\n\\n"}\n\n`))
              break
            }
          }
          
          // Get final response if we ended with tool results
          if (allMessages[allMessages.length - 1].role === 'user') {
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n"}\n\n`))
            
            const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8000,
                system: SYSTEM_PROMPT,
                messages: allMessages,
                temperature: 0.3,
                stream: true  // Enable streaming
              })
            })

            if (finalResponse.ok) {
              // Handle streaming response
              const reader = finalResponse.body?.getReader()
              if (!reader) throw new Error('No response body')
              
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
                        // Stream each chunk as it arrives from Claude
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

          // Signal completion
          controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
          
        } catch (error) {
          console.error('Stream error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ Error: ${errorMessage}"}\n\n`))
          controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable proxy buffering
      }
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}