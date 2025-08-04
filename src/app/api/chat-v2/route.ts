import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '@/claude-agent/tools'
import { getToolDefinitions } from '@/lib/woocommerce-tools'
import { executeToolWithCache, getToolPerformanceReport } from '@/claude-agent/tools/executor'

// System prompt for natural, conversational responses with structured data formatting
const SYSTEM_PROMPT = `You are a thorough business intelligence assistant for Flora Distro cannabis dispensary. You have access to real-time data and should be comprehensive in your analysis.

FORMATTING GUIDELINES - STRUCTURED DATA PRESENTATION:

Use markdown for summaries and explanations, then provide structured data in special code blocks:

**For tabular data** (inventory, products, sales):
\`\`\`json
[
  {"name": "Product Name", "stock": 45, "price": 29.99, "location": "Charlotte"},
  {"name": "Another Product", "stock": 12, "price": 39.99, "location": "Salisbury"}
]
\`\`\`

**For charts** (trends, comparisons, distributions):
\`\`\`chart
{
  "type": "bar",
  "title": "Top Products by Sales",
  "data": [
    {"name": "Lemon Runtz", "value": 124},
    {"name": "Oreoz", "value": 93}
  ]
}
\`\`\`

Chart types: "bar", "line", "pie"

**For regular content:**
- Use **bold** for key metrics and product names
- Use bullet points for lists
- Write conversational explanations
- ✓ ❌ 🔧 📊 ⚠️ for status only

**MANDATORY DATA FORMATTING:**

For ANY sales data, inventory data, or comparative data, you MUST use these code blocks:

\`\`\`chart
{
  "type": "bar",
  "title": "Sales Comparison - Last 5 Days", 
  "data": [
    {"name": "Aug 6", "Charlotte": 1093.95, "Blowing Rock": 149.98},
    {"name": "Aug 3", "Charlotte": 1792.8, "Blowing Rock": 0}
  ]
}
\`\`\`

For tabular data like product lists:

\`\`\`json
[
  {"product": "Lemon Runtz", "units": 124, "revenue": 3596},
  {"product": "Wedding Cake", "units": 87, "revenue": 2523}
]
\`\`\`

**CRITICAL RULE:** When user asks for "chart", "graph", "visualization", "trend", or "comparison" - you MUST ALWAYS respond with \`\`\`chart blocks. Never use plain text for any data that could be visualized.

**NEVER** present sales data, comparisons, or trends as plain text tables. **ALWAYS** use chart blocks for visual data and json blocks for detailed tables.

**Example Response Format:**
Based on the order data I have, here's the 5-day sales comparison between **Charlotte Monroe** and **Blowing Rock** locations:

\`\`\`chart
{
  "type": "bar",
  "title": "5-Day Sales Comparison",
  "data": [
    {"name": "Aug 6", "Charlotte": 1093.95, "Blowing Rock": 149.98},
    {"name": "Aug 3", "Charlotte": 1792.8, "Blowing Rock": 0}
  ]
}
\`\`\`

**Charlotte Monroe** significantly outperformed **Blowing Rock** with higher order values and volume.

CRITICAL: Do not explain data inside code blocks. Use proper code blocks for ALL data visualization.

IMPORTANT: Be strategic and efficient with tool usage. You have limited time for complex analysis:
1. Plan your approach before starting - minimize tool calls
2. Start with broader tools (get_locations, get_categories) to understand context
3. Use specific tools (get_location_stock, get_products) for detailed data
4. Avoid redundant calls - if you have recent data, analyze it rather than re-fetching
5. For time-sensitive queries, focus on the most critical data first

Time Management:
- Complex queries have ~80 seconds total execution time
- If you use more than 8-10 tools, provide interim analysis
- Always prioritize getting enough data for meaningful analysis over perfect completeness

Tool Usage Strategy:
- For location comparisons: get_location_stock for each location needed (this is the most time-consuming)
- For product research: get_categories first, then get_products with specific categories
- For inventory analysis: get_location_stock, then use bulk_get_inventory for specific products if needed
- AVOID: Calling the same tool with same parameters multiple times

Here's how to approach each request:

For inventory questions, use get_location_stock for single locations, bulk_get_inventory when you have product IDs, or get_multi_location_stock to compare across locations.

For finding products, use get_products (keep it to 10 items or less to avoid timeouts) or get_categories to understand how products are organized.

For sales and order information, use get_orders to get recent data and trends.

For location analysis, start with get_locations to get location info, then use the appropriate inventory tools.

The location IDs you'll need are Charlotte Monroe (30), Salisbury (31), Chesterfield (34), and Bon Air (35).

Always use real data from the tools, never make up numbers or information.

Keep your responses conversational and helpful, like you're talking to a colleague who asked you to look something up. Write in normal sentences without any special formatting or symbols.`

// API Configuration - FIXED: Use HTTPS to avoid 301 redirects
const WOO_BASE_URL = 'https://api.floradistro.com'
const WOO_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WOO_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

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
        let streamTimeout: NodeJS.Timeout | null = null
        
        // Set overall timeout for the stream
        streamTimeout = setTimeout(() => {
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n\\n⚠️ Response timeout - please try again"}\n\n`))
          controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
          controller.close()
        }, 90000) // 90 second timeout for complex queries
        
        try {
          // Build messages
          const messages = [
            ...conversation_history.slice(-4),
            { role: 'user', content: message }
          ]
          
          await processClaudeResponse(messages, controller, encoder)
          
        } catch (error) {
          console.error('Stream error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n\\n❌ Error: ${errorMessage}"}\n\n`))
        } finally {
          if (streamTimeout) clearTimeout(streamTimeout)
          controller.enqueue(encoder.encode('data: {"type": "done"}\n\n'))
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })

  } catch (error) {
    console.error('Chat V2 API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Tool execution with centralized caching and monitoring

async function processClaudeResponse(
  messages: any[], 
  controller: ReadableStreamDefaultController, 
  encoder: TextEncoder
) {
  let currentMessages = [...messages]
  let toolCallCount = 0
  const maxToolCalls = 25
  const startTime = Date.now()
  const maxExecutionTime = 80000 // 80 seconds, leaving 10s buffer
  
  // Continue tool calling loop until Claude stops using tools or we hit limit
  while (toolCallCount < maxToolCalls) {
    // Check if we're approaching time limit
    const elapsedTime = Date.now() - startTime
    if (elapsedTime > maxExecutionTime) {
      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n⏰ Approaching time limit, providing analysis with current data...\\n\\n"}\n\n`))
      break
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: currentMessages,
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
    let toolUses: any[] = []
    let toolResults: any[] = []
    let assistantMessage = ''
    let currentTool: any = null
    let hasToolUse = false
    
    // Process Claude's streaming response
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
          if (data === '[DONE]') break
          
          try {
            const parsed = JSON.parse(data)
            
            // Handle text responses
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              assistantMessage += parsed.delta.text
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
            }
            
            // Handle tool use start
            if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
              hasToolUse = true
              currentTool = {
                id: parsed.content_block.id,
                name: parsed.content_block.name,
                input: {},
                jsonString: ''
              }
              controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n🔧 ${currentTool.name}..."}\n\n`))
            }
            
            // Handle tool parameters
            if (parsed.type === 'content_block_delta' && parsed.delta?.partial_json && currentTool) {
              currentTool.jsonString += parsed.delta.partial_json
            }
            
            // Handle tool use completion
            if (parsed.type === 'content_block_stop' && currentTool) {
              try {
                currentTool.input = JSON.parse(currentTool.jsonString || '{}')
              } catch (e) {
                currentTool.input = {}
              }
              
              // Execute tool with improved logging and dynamic timeout
              const toolStartTime = Date.now()
              const elapsedTotal = toolStartTime - startTime
              const remainingTime = maxExecutionTime - elapsedTotal
              const toolTimeout = Math.max(5000, Math.min(15000, remainingTime / 2)) // Dynamic timeout
              
              const result = await executeToolSafely(currentTool, controller, encoder, toolTimeout)
              const duration = Date.now() - toolStartTime
              
              console.log(`🔧 Tool execution: ${currentTool.name} completed in ${duration}ms`)
              toolCallCount++
              
              toolUses.push({
                type: 'tool_use',
                id: currentTool.id,
                name: currentTool.name,
                input: currentTool.input
              })
              
              toolResults.push({
                type: 'tool_result',
                tool_use_id: currentTool.id,
                content: JSON.stringify(result)
              })
              
              currentTool = null
            }
            
          } catch (parseError) {
            // Skip malformed JSON
            continue
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    
    // If Claude didn't use any tools, we're done
    if (!hasToolUse) {
      break
    }
    
    // If we have tool results, add them to the conversation and continue
    if (toolResults.length > 0) {
      controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n"}\n\n`))
      
      // Add assistant message with tools to conversation
      currentMessages.push({
        role: 'assistant',
        content: [
          ...(assistantMessage ? [{ type: 'text', text: assistantMessage }] : []),
          ...toolUses
        ]
      })
      
      // Add tool results as user message
      currentMessages.push({
        role: 'user',
        content: toolResults
      })
      
      // Reset for next iteration
      toolUses = []
      toolResults = []
      assistantMessage = ''
      
      // Check if we've hit the tool limit
      if (toolCallCount >= maxToolCalls) {
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n⚠️ Reached maximum tool calls (${maxToolCalls}). Providing analysis with current data...\\n\\n"}\n\n`))
        break
      }
      
      // Check if we're running out of time
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > maxExecutionTime) {
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n⏰ Time limit reached. Providing analysis with current data...\\n\\n"}\n\n`))
        break
      }
      
      // Progress indicator for complex queries
      if (toolCallCount > 5) {
        const progress = Math.min(Math.round((toolCallCount / maxToolCalls) * 100), 95)
        const timeRemaining = Math.max(0, (maxExecutionTime - elapsedTime) / 1000)
        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n📈 Deep analysis in progress (${toolCallCount}/${maxToolCalls} tools, ${progress}%, ~${Math.round(timeRemaining)}s remaining)...\\n"}\n\n`))
      }
      
      // Continue the loop for more tool calls
      continue
    }
    
    // No tool results means no tools were used, break
    break
  }
  
  // No additional final analysis needed - Claude will provide complete response in main loop
}

async function executeToolSafely(
  tool: any, 
  controller: ReadableStreamDefaultController, 
  encoder: TextEncoder,
  timeoutMs: number = 15000
): Promise<any> {
  const apiConfig = {
    baseUrl: WOO_BASE_URL,
    consumerKey: WOO_CONSUMER_KEY,
    consumerSecret: WOO_CONSUMER_SECRET
  }
  
  const executionResult = await executeToolWithCache(
    tool.name,
    tool.input,
    apiConfig,
    timeoutMs
  )
  
  if (executionResult.success) {
    const icon = executionResult.cached ? ' 💾' : ' ✓'
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": "${icon}"}\n\n`))
    return executionResult.result
  } else {
    controller.enqueue(encoder.encode(`data: {"type": "text", "content": " ❌"}\n\n`))
    
    // Return error as result so Claude can handle it
    return {
      error: true,
      message: executionResult.error || 'Tool execution failed'
    }
  }
}

async function streamResponse(
  response: Response, 
  controller: ReadableStreamDefaultController, 
  encoder: TextEncoder
) {
  const reader = response.body?.getReader()
  if (!reader) return
  
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
        if (data === '[DONE]') continue
        
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}