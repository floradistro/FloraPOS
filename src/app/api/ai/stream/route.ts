import { NextRequest } from 'next/server';
import { ApiConfig } from '@/lib/api-config';

export const runtime = 'edge';

const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const { message, temperature, max_tokens, conversation } = await request.json();

    console.log('📨 Received streaming request:', { message: message.substring(0, 50), temperature, max_tokens });

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming response immediately
    (async () => {
      try {
        // Get WordPress API base URL
        const wpBaseUrl = ApiConfig.getBaseUrl();
        
        // Build URL with authentication
        const claudeUrl = new URL(`${wpBaseUrl}/wp-json/flora-im/v1/ai/chat`);
        claudeUrl.searchParams.append('consumer_key', CONSUMER_KEY);
        claudeUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);

        console.log('🔄 Streaming AI request to:', claudeUrl.toString().replace(CONSUMER_SECRET, '***'));
        
        // Make request to WordPress backend with STREAMING enabled
        const response = await fetch(claudeUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            temperature,
            max_tokens,
            conversation,
            stream: true  // 🔥 ENABLE TRUE STREAMING from Claude!
          }),
        });
        
        console.log(`⏱️ WordPress stream started, status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ WordPress API error:', response.status, errorText);
          throw new Error(`AI API error: ${response.status} - ${errorText}`);
        }

        // WordPress is now streaming SSE - forward events directly!
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('No response body available');
        }
        
        // Read and forward WordPress SSE stream
        let buffer = '';
        let eventCount = 0;
        
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`✅ Stream complete after ${eventCount} events`);
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';  // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim() === '') continue;  // Skip empty lines
            
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const wpEvent = JSON.parse(jsonStr);
                eventCount++;
                console.log(`📨 Event #${eventCount} - Type: ${wpEvent.type}, Data length: ${String(wpEvent.data || '').length}`);
                
                // Forward WordPress events to frontend
                // WordPress sends: {type: 'thinking'|'content'|'tool_call'|'done', data: ...}
                // We need: {type: 'thinking'|'content'|'done', content: ...}
                
                if (wpEvent.type === 'thinking' || wpEvent.type === 'extended_thinking') {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'thinking', 
                        content: wpEvent.data 
                      })}\n\n`
                    )
                  );
                } else if (wpEvent.type === 'content' || wpEvent.type === 'response') {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'content', 
                        content: wpEvent.data 
                      })}\n\n`
                    )
                  );
                } else if (wpEvent.type === 'tool_call') {
                  // Forward tool calls so frontend can display them
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'tool_call', 
                        content: wpEvent.data 
                      })}\n\n`
                    )
                  );
                } else if (wpEvent.type === 'tool_result') {
                  // Forward tool results
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ 
                        type: 'tool_result', 
                        content: wpEvent.data 
                      })}\n\n`
                    )
                  );
                } else if (wpEvent.type === 'done') {
                  // Send completion signal
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
                console.error('Error parsing SSE event:', parseError, 'Line:', line);
              }
            }
          }
        }

      } catch (error) {
        console.error('Streaming error:', error);
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

