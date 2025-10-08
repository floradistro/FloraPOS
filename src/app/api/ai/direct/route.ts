import { NextRequest } from 'next/server';
import { aiAgentService } from '@/services/ai-agent-service';

/**
 * Direct Claude API streaming endpoint
 * Used for pure code generation and general queries without database access
 * For data queries, use WordPress proxy endpoint instead
 */
export async function POST(request: NextRequest) {
  try {
    const { message, temperature, max_tokens, conversation = [], needsWordPressData = false, user_location = null } = await request.json();

    console.log('🚀 Direct Claude streaming request with conversation history:', conversation.length, 'messages');
    console.log('🔌 WordPress data access:', needsWordPressData ? 'ENABLED' : 'DISABLED');

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming response immediately
    (async () => {
      try {
        // Fetch agent config from Supabase
        console.log('📡 Fetching agent config from Supabase...');
        const agent = await aiAgentService.getActiveAgent();

        if (!agent) {
          console.error('❌ No active agent found in Supabase');
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                error: 'No active AI agent configured. Please configure an agent in Supabase.' 
              })}\n\n`
            )
          );
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done', done: true })}\n\n`
            )
          );
          return;
        }

        // Use agent's API key
        const apiKey = agent.api_key;
        
        // Use agent settings or fallback to request params
        const actualTemperature = temperature ?? agent.temperature;
        const actualMaxTokens = max_tokens ?? agent.max_tokens;
        const systemPrompt = agent.system_prompt;

        console.log('✅ Agent config loaded from Supabase:', {
          name: agent.name,
          model: agent.model,
          temperature: actualTemperature,
          max_tokens: actualMaxTokens,
        });
        
        if (!apiKey) {
          console.error('❌ Agent has no API key configured');
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                error: 'AI agent has no API key configured. Please update the agent configuration in Supabase.' 
              })}\n\n`
            )
          );
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done', done: true })}\n\n`
            )
          );
          return;
        }

        const claudeEndpoint = 'https://api.anthropic.com/v1/messages';
        
        console.log('🔌 Connecting directly to Claude API...');

        // Add location context to system prompt if available
        const locationContext = user_location ? `\n\n**CURRENT USER LOCATION:** The user is currently logged into ${user_location.name} (Location ID: ${user_location.id}). When discussing inventory, stock levels, or transfers, this is their primary location unless they specify otherwise.` : '';
        
        const fullSystemPrompt = systemPrompt + locationContext;

        // Build messages array with conversation history
        const messages = [
          ...conversation.map((m: any) => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user', content: message }
        ];

        console.log('💬 Sending', messages.length, 'messages to Claude (includes history)');

        // Make direct streaming request to Claude
        const response = await fetch(claudeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: agent.model,
            max_tokens: actualMaxTokens,
            temperature: actualTemperature,
            system: fullSystemPrompt,
            messages: messages,
            stream: true
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }

        console.log('✅ Claude stream started');

        // Read and forward Claude's stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('No response body available');
        }

        let buffer = '';
        let thinkingBuffer = '';
        let contentBuffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Claude stream complete');
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              
              if (jsonStr === '[DONE]') {
                continue;
              }
              
              try {
                const event = JSON.parse(jsonStr);
                const type = event.type;
                
                // Handle different event types
                if (type === 'content_block_start') {
                  const blockType = event.content_block?.type;
                  
                  if (blockType === 'thinking') {
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({ 
                          type: 'thinking', 
                          content: '🧠 Claude is thinking...' 
                        })}\n\n`
                      )
                    );
                  }
                }
                else if (type === 'content_block_delta') {
                  const delta = event.delta;
                  
                  // THINKING TOKENS
                  if (delta?.type === 'thinking_delta') {
                    const newThinking = delta.thinking || '';
                    thinkingBuffer += newThinking;
                    // Send only the NEW thinking text, not the entire buffer
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({ 
                          type: 'thinking', 
                          content: newThinking  // Send delta only!
                        })}\n\n`
                      )
                    );
                  }
                  // CONTENT TOKENS
                  else if (delta?.type === 'text_delta') {
                    const newText = delta.text || '';
                    contentBuffer += newText;
                    // Send only the NEW text, not the entire buffer
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({ 
                          type: 'content', 
                          content: newText  // Send delta only!
                        })}\n\n`
                      )
                    );
                  }
                }
                else if (type === 'message_stop') {
                  // Stream complete
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'done', 
                        done: true 
                      })}\n\n`
                    )
                  );
                  break;
                }
              } catch (parseError) {
                console.error('Error parsing event:', parseError);
              }
            }
          }
        }

      } catch (error) {
        console.error('❌ Direct streaming error:', error);
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

    // Return the ReadableStream as a Response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream setup error:', error);
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

