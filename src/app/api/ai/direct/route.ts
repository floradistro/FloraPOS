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
        // Fetch agent config from Supabase with timeout and retry
        console.log('📡 Fetching agent config from Supabase...');
        
        let agent = null;
        let lastError = null;
        
        // Retry up to 2 times with 5s timeout each
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const agentPromise = aiAgentService.getActiveAgent();
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Supabase timeout (5s)')), 5000)
            );
            
            agent = await Promise.race([agentPromise, timeoutPromise]);
            if (agent) break; // Success
          } catch (error: any) {
            lastError = error;
            console.warn(`⚠️ Supabase fetch attempt ${attempt} failed:`, error.message);
            if (attempt < 2) await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
          }
        }
        
        if (!agent) {
          console.error('❌ Failed to fetch agent after retries:', lastError);
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                error: 'Unable to load AI configuration. Please refresh and try again.' 
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

        // Create abort controller for timeout
        const abortController = new AbortController();
        const connectionTimeout = setTimeout(() => {
          abortController.abort();
          console.error('❌ Claude API connection timeout (30s)');
        }, 30000); // 30 second connection timeout

        let response;
        try {
          // Make direct streaming request to Claude
          response = await fetch(claudeEndpoint, {
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
            signal: abortController.signal,
          });

          clearTimeout(connectionTimeout);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API error:', response.status, errorText);
            
            // Provide specific error messages based on status
            if (response.status === 429) {
              throw new Error('Claude API rate limit exceeded. Please wait a moment and try again.');
            } else if (response.status === 529) {
              throw new Error('Claude API is temporarily overloaded. Please try again in a few seconds.');
            } else if (response.status >= 500) {
              throw new Error('Claude API server error. Please try again.');
            } else if (response.status === 401) {
              throw new Error('Invalid Claude API key. Please check agent configuration.');
            } else {
              throw new Error(`Claude API error: ${response.status} - ${errorText}`);
            }
          }
        } catch (fetchError: any) {
          clearTimeout(connectionTimeout);
          
          // Handle fetch-level errors (network, timeout, etc)
          if (fetchError.name === 'AbortError') {
            throw new Error('Connection to Claude API timed out (30s). Please try again.');
          } else if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
            throw new Error('Network error connecting to Claude API. Please check your connection and try again.');
          } else {
            throw fetchError;
          }
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
        let lastActivity = Date.now();
        const streamTimeout = 45000; // 45 second stream timeout
        
        while (true) {
          // Check for stream stall
          if (Date.now() - lastActivity > streamTimeout) {
            console.error('❌ Stream stalled - no data for 45 seconds');
            throw new Error('Stream timeout - Claude API stopped responding');
          }

          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Claude stream complete');
            break;
          }
          
          lastActivity = Date.now(); // Reset timeout on data
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

