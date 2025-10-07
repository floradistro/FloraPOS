import { NextRequest } from 'next/server';
import { requestCache } from '@/lib/request-cache';

export const runtime = 'edge';

/**
 * WordPress Proxy Endpoint
 * Handles tool chaining by calling Claude directly from Next.js
 * and executing tools via WordPress API
 * 
 * This bypasses Docker WordPress SSL issues by having Next.js
 * communicate with Claude API directly
 */
export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [], user_location = null } = await request.json();

    console.log('🔄 WordPress Proxy request:', { 
      messagePreview: message.substring(0, 50),
      conversationLength: conversation.length,
      userLocation: user_location ? `${user_location.name} (ID: ${user_location.id})` : 'Not specified'
    });

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming response
    (async () => {
      try {
        // Step 1: Fetch agent config from WordPress
        const apiEnv = request.headers.get('x-api-environment') || 'docker';
        const wpBaseUrl = apiEnv === 'docker' 
          ? 'http://localhost:8081' 
          : process.env.NEXT_PUBLIC_PRODUCTION_API_URL;


        // Use cache for agent config (5 min TTL)
        const agentData = await requestCache.get(
          `agent-config-${apiEnv}`,
          async () => {
            const response = await fetch(`${wpBaseUrl}/wp-json/flora-im/v1/ai/agents/active`, {
              headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch agent config: ${response.status}`);
            }
            return await response.json();
          },
          5 * 60 * 1000 // 5 minutes
        );

        // WordPress wraps response in {success, agent}
        const agentConfig = agentData.agent || agentData;

        console.log('✅ Agent config loaded:', {
          model: agentConfig.model,
          temperature: agentConfig.temperature,
          max_tokens: agentConfig.max_tokens,
        });

        // Step 2: Fetch available tools from WordPress (cached 5 min)
        const toolsData = await requestCache.get(
          `tools-${apiEnv}`,
          async () => {
            const response = await fetch(`${wpBaseUrl}/wp-json/flora-im/v1/ai/tools`, {
              headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch tools: ${response.status}`);
            }
            return await response.json();
          },
          5 * 60 * 1000 // 5 minutes
        );

        const tools = toolsData.tools || [];
        console.log('✅ Tools loaded:', tools.length, 'tools available');

        // Step 3: Get Claude API key
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        if (!claudeApiKey) {
          throw new Error('CLAUDE_API_KEY not configured');
        }

        // Step 4: Build messages for Claude with location context
        let enhancedMessage = message;
        
        // If user has a location, add context to the message
        if (user_location && user_location.id) {
          enhancedMessage = `[LOCATION CONTEXT: User is currently at ${user_location.name} (Location ID: ${user_location.id})]\n\n${message}`;
        }
        
        const messages = [
          ...conversation.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: enhancedMessage },
        ];


        // Step 5: Call Claude API with tools
        let iterationCount = 0;
        const maxIterations = 25; // Support complex multi-tool workflows
        let totalToolsExecuted = 0;

        // Send initial thinking message
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'thinking', content: 'Analyzing request and planning tool usage...' })}\n\n`
          )
        );

        while (iterationCount < maxIterations) {
          iterationCount++;
          console.log(`🔄 Tool chain iteration ${iterationCount}`);

          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': claudeApiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: agentConfig.model || 'claude-sonnet-4-20250514',
              max_tokens: parseInt(agentConfig.max_tokens) || 8192,
              temperature: parseFloat(agentConfig.temperature) || 0.9,
              system: agentConfig.system_prompt || 'You are a helpful AI assistant.',
              messages: messages,
              tools: tools,
              stream: false, // Non-streaming for tool chaining reliability
            }),
          });

          if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
          }

          const claudeResult = await claudeResponse.json();
          console.log('📨 Claude response:', {
            stopReason: claudeResult.stop_reason,
            contentBlocks: claudeResult.content?.length || 0,
          });

          // Check if Claude wants to use tools
          const toolUseBlocks = claudeResult.content?.filter((block: any) => block.type === 'tool_use') || [];

          if (toolUseBlocks.length === 0) {
            // No tools requested - stream final response word by word for smooth UX
            const textContent = claudeResult.content
              ?.filter((block: any) => block.type === 'text')
              .map((block: any) => block.text)
              .join('') || '';

            console.log('✅ Final response ready, length:', textContent.length);

            // Stream response in chunks for smooth typewriter effect
            const words = textContent.split(' ');
            const chunkSize = 3; // Stream 3 words at a time
            
            for (let i = 0; i < words.length; i += chunkSize) {
              const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
              
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`
                )
              );
              
              // Small delay for smooth streaming
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'done', done: true })}\n\n`
              )
            );

            break;
          }

          // Execute all tools and collect results
          console.log('🔧 Executing', toolUseBlocks.length, 'tool(s)');

          // Send progress update
          totalToolsExecuted += toolUseBlocks.length;
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'thinking', 
                content: `Executing ${toolUseBlocks.length} tool(s)... (Total: ${totalToolsExecuted})` 
              })}\n\n`
            )
          );

          const toolResults = [];

          for (let i = 0; i < toolUseBlocks.length; i++) {
            const toolUse = toolUseBlocks[i];
            
            // Show progress for each tool
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'tool_call', 
                  content: `[${i + 1}/${toolUseBlocks.length}] ${toolUse.name}...` 
                })}\n\n`
              )
            );

            // Call WordPress to execute tool
            const toolResponse = await fetch(`${wpBaseUrl}/wp-json/flora-im/v1/ai/tools/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tool_name: toolUse.name,
                tool_input: toolUse.input,
              }),
            });

            if (!toolResponse.ok) {
              const errorText = await toolResponse.text();
              console.error('❌ Tool execution failed:', toolUse.name, errorText);
              throw new Error(`Tool execution failed: ${toolResponse.status}`);
            }

            const toolResult = await toolResponse.json();
            console.log('✅ Tool executed:', toolUse.name);

            // Validate and potentially truncate tool result
            let resultContent = toolResult.result;
            const resultStr = JSON.stringify(resultContent);
            const MAX_RESULT_SIZE = 50000; // 50k chars max

            if (resultStr.length > MAX_RESULT_SIZE) {
              console.warn(`⚠️ Tool result too large (${resultStr.length} chars), truncating...`);
              
              // If it's an array, take first items
              if (Array.isArray(resultContent)) {
                resultContent = {
                  truncated: true,
                  total_count: resultContent.length,
                  sample: resultContent.slice(0, 20),
                  message: `Result truncated: Showing 20 of ${resultContent.length} items`
                };
              } else {
                resultContent = {
                  truncated: true,
                  summary: 'Result too large, please refine query',
                  size: resultStr.length
                };
              }
            }

            // Show completion for this tool
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'tool_result', 
                  content: `✓ ${toolUse.name} complete` 
                })}\n\n`
              )
            );

            // Collect tool result in proper format
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(resultContent),
            });
          }

          // Add Claude's assistant message with tool use
          messages.push({
            role: 'assistant',
            content: claudeResult.content,
          });

          // Add user message with ALL tool results
          messages.push({
            role: 'user',
            content: toolResults,
          });

          // Send thinking message before next Claude call
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'thinking', 
                content: `Processing results and continuing analysis...` 
              })}\n\n`
            )
          );

          // Continue loop to get Claude's next response
        }

        if (iterationCount >= maxIterations) {
          console.warn('⚠️ Max tool iterations reached:', maxIterations);
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'content', 
                content: `\n\n_Note: Reached maximum tool chain limit (${maxIterations} iterations). Task may be incomplete._` 
              })}\n\n`
            )
          );
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done', done: true })}\n\n`
            )
          );
        }

      } catch (error) {
        console.error('❌ WordPress proxy error:', error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Proxy setup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

