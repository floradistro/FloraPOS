import { NextRequest } from 'next/server';

export const runtime = 'edge';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json();

    console.log('🎨 Background AI request:', message.substring(0, 50));

    // Build messages array
    const messages = [
      ...conversation,
      {
        role: 'user',
        content: message
      }
    ];

    // System prompt optimized for background generation
    const systemPrompt = `You are a creative background designer for TV menu displays. Generate beautiful, modern animated backgrounds using HTML/CSS.

CRITICAL REQUIREMENTS:
- Return ONLY the HTML/CSS code in a code block
- Must be a single <div> element with inline styles
- Use: position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, overflow: 'hidden'
- Keep animations simple and performant
- No external dependencies or imports
- Use inline styles only

Example format:
\`\`\`html
<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <!-- Your creative elements here -->
</div>
\`\`\`

Be creative and modern!`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start Claude API call
    (async () => {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature: 0.7,
            system: systemPrompt,
            messages: messages,
            stream: true
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`)
                );
                break;
              }

              try {
                const event = JSON.parse(data);

                if (event.type === 'content_block_delta' && event.delta?.text) {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'content', content: event.delta.text })}\n\n`
                    )
                  );
                } else if (event.type === 'message_stop') {
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`)
                  );
                  break;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error('Claude streaming error:', error);
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
    console.error('Background AI error:', error);
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

