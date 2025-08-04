import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '@/claude-agent/tools'
import { getToolDefinitions } from '@/lib/woocommerce-tools'

// System prompt for natural, conversational responses WITHOUT markdown
const SYSTEM_PROMPT = `You are a helpful business intelligence assistant for Flora Distro cannabis dispensary. You have access to real-time data and should respond naturally like a knowledgeable human colleague would.

CRITICAL: Write responses in clean, natural language without ANY formatting:
- NO asterisks ** for bold 
- NO hash symbols ### for headers
- NO bullet points or dashes - 
- NO excessive emojis (only ✓ and ❌ for status are acceptable)
- NO markdown formatting whatsoever

Write like you're speaking naturally to a colleague. Use simple, clear sentences.

When someone asks you a question, think about what information they need, use the appropriate tools to get real data, then provide a clear and helpful response in plain conversational language.

Here's how to approach each request:

First, consider what the user is really asking for and which tools would be most helpful.

For inventory questions, you can use get_location_stock for single locations, bulk_get_inventory when you have product IDs, or get_multi_location_stock to compare across locations.

For finding products, use get_products (keep it to 10 items or less to avoid timeouts) or get_categories to understand how products are organized.

For sales and order information, use get_orders to get recent data and trends.

For location analysis, start with get_locations to get location info, then use the appropriate inventory tools.

The location IDs you'll need are Charlotte Monroe (30), Salisbury (31), Chesterfield (34), and Bon Air (35).

If your first approach doesn't give you what you need, try a different tool or approach. If results are partial or limited, just explain what you found clearly in plain language. Always use real data from the tools, never make up numbers or information.

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
        
        try {
          // Build messages with tool definitions
          const messages = [
            ...conversation_history.slice(-4),
            { role: 'user', content: message }
          ]
          
          // Call Claude with tool use enabled
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              system: SYSTEM_PROMPT,
              messages,
              tools: getToolDefinitions(),
              // Let Claude decide when to use tools - no forcing
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
          let currentToolUse: any = null
          let toolResults: any[] = []
          let assistantMessage = ''
          let hasToolUse = false
          let toolUses: any[] = []
          
          // Process Claude's streaming response
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
                  
                  // Handle text responses
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    assistantMessage += parsed.delta.text
                    controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
                  }
                  
                  // Handle tool use
                  if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                    hasToolUse = true
                    currentToolUse = {
                      id: parsed.content_block.id,
                      name: parsed.content_block.name,
                      input: {}
                    }
                                            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\nUsing tool: ${currentToolUse.name}..."}\n\n`))
                  }
                  
                  if (parsed.type === 'content_block_delta' && parsed.delta?.partial_json) {
                    if (currentToolUse) {
                      try {
                        // Accumulate the JSON string
                        if (!currentToolUse.jsonString) {
                          currentToolUse.jsonString = ''
                        }
                        currentToolUse.jsonString += parsed.delta.partial_json
                      } catch (e) {
                        // Continue accumulating
                      }
                    }
                  }
                  
                  if (parsed.type === 'content_block_stop' && currentToolUse) {
                    // Parse the complete JSON
                    try {
                      currentToolUse.input = JSON.parse(currentToolUse.jsonString || '{}')
                    } catch (e) {
                      currentToolUse.input = {}
                    }
                    
                    // Save for assistant message content
                    toolUses.push({
                      type: 'tool_use',
                      id: currentToolUse.id,
                      name: currentToolUse.name,
                      input: currentToolUse.input
                    })
                    
                    // Execute the tool
                    const apiConfig = {
                      baseUrl: WOO_BASE_URL,
                      consumerKey: WOO_CONSUMER_KEY,
                      consumerSecret: WOO_CONSUMER_SECRET
                    }
                    
                    try {
                      // Log what Claude is requesting
                                              console.log(`Claude requesting: ${currentToolUse.name} with params:`, currentToolUse.input)
                      
                      // Add timeout protection
                      const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Tool execution timeout')), 15000)
                      )
                      
                      const result = await Promise.race([
                        executeTool(currentToolUse.name, currentToolUse.input, apiConfig),
                        timeoutPromise
                      ])
                      
                      toolResults.push({
                        type: 'tool_result',
                        tool_use_id: currentToolUse.id,
                        content: JSON.stringify(result)
                      })
                      
                      controller.enqueue(encoder.encode(`data: {"type": "text", "content": " ✓\\n"}\n\n`))
                    } catch (error) {
                      // If it's a timeout on get_products, retry with smaller page size
                      if (error instanceof Error && error.message === 'Tool execution timeout' && 
                          currentToolUse.name === 'get_products') {
                        try {
                          controller.enqueue(encoder.encode(`data: {"type": "text", "content": " (retrying with smaller page size)..."}\n\n`))
                          const retryResult = await executeTool('get_products', { per_page: 5 }, apiConfig)
                          toolResults.push({
                            type: 'tool_result',
                            tool_use_id: currentToolUse.id,
                            content: JSON.stringify(retryResult)
                          })
                          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "✓ "}\n\n`))
                        } catch (retryError) {
                          toolResults.push({
                            type: 'tool_result',
                            tool_use_id: currentToolUse.id,
                            content: JSON.stringify({
                              error: true,
                              message: 'API timeout - try requesting fewer items'
                            })
                          })
                          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ "}\n\n`))
                        }
                      } else {
                        toolResults.push({
                          type: 'tool_result',
                          tool_use_id: currentToolUse.id,
                          content: JSON.stringify({
                            error: true,
                            message: error instanceof Error ? error.message : 'Tool execution failed'
                          })
                        })
                        controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ "}\n\n`))
                      }
                    }
                    
                    currentToolUse = null
                  }
                } catch (e) {
                  console.error('Parse error:', e)
                }
              }
            }
          }
          
          // If Claude used tools, send the results back and allow adaptive tool selection
          if (hasToolUse && toolResults.length > 0) {
            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\nAnalyzing results...\\n\\n"}\n\n`))
            
            // Build assistant content like working route
            const assistantContent = []
            if (assistantMessage) {
              assistantContent.push({ type: 'text', text: assistantMessage })
            }
            assistantContent.push(...toolUses)
            
            const followUpMessages = [
              ...messages,
              {
                role: 'assistant',
                content: assistantContent
              },
              {
                role: 'user',
                content: toolResults  // toolResults already has correct format with type: 'tool_result'
              }
            ]
            
            // Allow Claude to analyze results AND potentially use more tools if needed
            const adaptiveResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                system: SYSTEM_PROMPT + `\n\nBased on the tool results you just received, decide if you need to:
1. Use additional/different tools to get more complete data
2. Provide analysis with the data you have
3. Try alternative tools if results were insufficient

Be strategic - if results are empty or insufficient, try different tools. If you have good data, analyze it.`,
                messages: followUpMessages,
                tools: getToolDefinitions(), // Allow more tool use
                temperature: 0.1,
                stream: true
              })
            })

            if (!adaptiveResponse.ok) {
              throw new Error(`Claude adaptive response error: ${adaptiveResponse.statusText}`)
            }

            // Process the adaptive response (might include more tools or final analysis)
            const adaptiveReader = adaptiveResponse.body?.getReader()
            if (adaptiveReader) {
              let adaptiveBuffer = ''
              let moreToolUses = []
              let moreToolResults = []
              let finalMessage = ''
              
              while (true) {
                const { done, value } = await adaptiveReader.read()
                if (done) break
                
                adaptiveBuffer += decoder.decode(value, { stream: true })
                const lines = adaptiveBuffer.split('\n')
                adaptiveBuffer = lines.pop() || ''
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim()
                    if (data === '[DONE]') break
                    
                    try {
                      const parsed = JSON.parse(data)
                      
                      // Handle text responses
                      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                        finalMessage += parsed.delta.text
                        controller.enqueue(encoder.encode(`data: {"type": "text", "content": ${JSON.stringify(parsed.delta.text)}}\n\n`))
                      }
                      
                      // Handle additional tool use
                      if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                        const newToolUse = {
                          id: parsed.content_block.id,
                          name: parsed.content_block.name,
                          input: {},
                          jsonString: ''
                        }
                        moreToolUses.push(newToolUse)
                                                    controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\nTrying ${parsed.content_block.name}...\\n"}\n\n`))
                      }
                      
                      if (parsed.type === 'content_block_delta' && parsed.delta?.partial_json) {
                        const lastTool = moreToolUses[moreToolUses.length - 1]
                        if (lastTool) {
                          lastTool.jsonString += parsed.delta.partial_json
                        }
                      }
                      
                      if (parsed.type === 'content_block_stop' && moreToolUses.length > 0) {
                        const lastTool = moreToolUses[moreToolUses.length - 1]
                        if (lastTool) {
                          try {
                            lastTool.input = JSON.parse(lastTool.jsonString || '{}')
                          } catch (e) {
                            lastTool.input = {}
                          }
                          
                          // Execute the adaptive tool
                          try {
                            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "Executing adaptive tool call...\\n"}\n\n`))
                            const adaptiveResult = await executeTool(lastTool.name, lastTool.input, {
                              baseUrl: WOO_BASE_URL,
                              consumerKey: WOO_CONSUMER_KEY,
                              consumerSecret: WOO_CONSUMER_SECRET
                            })
                            
                            moreToolResults.push({
                              type: 'tool_result',
                              tool_use_id: lastTool.id,
                              content: JSON.stringify(adaptiveResult)
                            })
                            
                            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "✅ Adaptive tool completed\\n\\n"}\n\n`))
                          } catch (error) {
                            controller.enqueue(encoder.encode(`data: {"type": "text", "content": "❌ Adaptive tool failed: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\n"}\n\n`))
                          }
                        }
                      }
                    } catch (e) {
                      // Skip parsing errors
                    }
                  }
                }
              }
              
              // If we executed more tools, get final analysis
              if (moreToolResults.length > 0) {
                controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n"}\n\n`))
                
                const finalMessages = [
                  ...followUpMessages,
                  {
                    role: 'assistant',
                    content: moreToolUses.map(tool => ({
                      type: 'tool_use',
                      id: tool.id,
                      name: tool.name,
                      input: tool.input
                    }))
                  },
                  {
                    role: 'user',
                    content: moreToolResults
                  }
                ]
                
                const finalAnalysis = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                  },
                  body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4000,
                    system: SYSTEM_PROMPT,
                    messages: finalMessages,
                    temperature: 0.1,
                    stream: true
                    // No tools for final analysis
                  })
                })
                
                if (finalAnalysis.ok) {
                  const finalReader = finalAnalysis.body?.getReader()
                  if (finalReader) {
                    let finalBuffer = ''
                    
                    while (true) {
                      const { done, value } = await finalReader.read()
                      if (done) break
                      
                      finalBuffer += decoder.decode(value, { stream: true })
                      const lines = finalBuffer.split('\n')
                      finalBuffer = lines.pop() || ''
                      
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
                            // Skip
                          }
                        }
                      }
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
          controller.enqueue(encoder.encode(`data: {"type": "text", "content": "\\n\\n❌ Error: ${errorMessage}"}\n\n`))
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