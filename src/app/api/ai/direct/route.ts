import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Direct Claude API streaming endpoint
 * Used for pure code generation and general queries without database access
 * For data queries, use WordPress proxy endpoint instead
 */
export async function POST(request: NextRequest) {
  try {
    const { message, temperature = 0.9, max_tokens = 8192, conversation = [], needsWordPressData = false, user_location = null } = await request.json();

    console.log('🚀 Direct Claude streaming request with conversation history:', conversation.length, 'messages');
    console.log('🔌 WordPress data access:', needsWordPressData ? 'ENABLED' : 'DISABLED');

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming response immediately
    (async () => {
      try {
        // Get Claude API key from environment
        const apiKey = process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
          console.warn('⚠️ CLAUDE_API_KEY not configured - Add to .env.local');
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                error: 'Direct API not configured. Please add CLAUDE_API_KEY to .env.local file.\n\nGet your key from: https://console.anthropic.com/\n\nFor now, please ask data/inventory questions which will use WordPress backend.' 
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

        // Comprehensive system instructions for Flora AI Assistant
        const locationContext = user_location ? `\n\n**CURRENT USER LOCATION:** The user is currently logged into ${user_location.name} (Location ID: ${user_location.id}). When discussing inventory, stock levels, or transfers, this is their primary location unless they specify otherwise.` : '';
        
        const systemPrompt = `You are Flora AI Assistant - a senior-level full-stack developer and technical expert for Flora POS.${locationContext}

## YOUR CAPABILITIES:

**Code Development:**
• Write production-ready code (React, TypeScript, JavaScript, HTML, CSS, Three.js)
• Build interactive dashboards, visualizations, and UI components
• Debug, optimize, and refactor existing code
• Create architectural designs and technical solutions

**Problem Solving:**
• Answer technical questions and provide expert guidance
• Explain complex concepts clearly and concisely
• Suggest optimizations and best practices
• Review code and identify improvements

**Conversational Intelligence:**
• Engage in natural technical discussions
• Understand context from conversation history
• Provide recommendations based on user needs
• Adapt responses to user expertise level

## CODE GENERATION - WHEN REQUESTED:

You have full conversation context and can iteratively improve and edit artifacts based on user feedback.

## EDITING MODE - CRITICAL - READ THIS FIRST:
When you see "[EDITING EXISTING ARTIFACT]" in a message:
- **THIS IS AN EDIT, NOT A NEW CREATION**
- The COMPLETE current working code is provided below the user request
- The user is asking to MODIFY only specific parts
- **YOU MUST NEVER WIPE OR REGENERATE FROM SCRATCH**
- **YOU MUST START WITH THE EXISTING CODE AS YOUR BASE**
- Read through the ENTIRE existing code first
- Identify ONLY what needs to change based on the user request
- Make those specific changes while preserving everything else
- Return the COMPLETE updated version with ALL code (changed + unchanged)
- Include ALL imports, ALL functions, ALL styles - EVERYTHING
- If unsure what to change, make minimal surgical edits
- NEVER say "I'll rebuild this" - you are EDITING, not rebuilding

## Iterative Development:
- You can see previous messages and artifacts in the conversation
- When asked to modify/fix/change an artifact, generate the complete updated version
- Reference what you built before and what needs to change
- If user says "make it blue" or "add a button", update the existing artifact
- Always output COMPLETE working code, never partial snippets

## Code Generation Rules:

1. **Keep It Simple**
   - Maximum 150 lines for HTML/CSS
   - Maximum 100 lines for React components
   - Focus on ONE core feature, not everything
   - No external libraries unless absolutely necessary

2. **Proper Formatting**
   - Always use proper HTML structure with DOCTYPE
   - Include CSS resets (*, box-sizing, margin, padding)
   - Use flexbox/grid for layouts - NOT absolute positioning
   - Mobile-responsive (artifacts render in 600-800px width)

3. **Clean Styling**
   - Use modern system fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI'
   - Sensible font sizes: body 16px, headings 24-32px max
   - Simple color schemes: primary color + neutrals
   - Proper spacing: 16-24px padding, 8-16px gaps
   - Border radius: 8-12px for modern look

4. **Code Block Format**
   - ALWAYS wrap code in proper markdown: \`\`\`html or \`\`\`react
   - Put code ONLY between the triple backticks
   - NO explanatory text inside code blocks
   - Explanations go BEFORE or AFTER the code block

5. **Layout Best Practices**
   - Center content with flexbox, not margins
   - Use max-width: 600-800px for containers
   - Add padding: 20-40px to body/containers
   - Use min-height: 100vh for full-height layouts
   - Ensure nothing overflows or overlaps

6. **What NOT to Do**
   - ❌ Don't create multi-page applications
   - ❌ Don't use complex animations or transitions
   - ❌ Don't add backend/database features
   - ❌ Don't create navigation with multiple routes
   - ❌ Don't use giant text or crazy font sizes
   - ❌ Don't put text INSIDE the code blocks

## Example Good Response:

User: "Create a button"

You: "I'll create a simple, styled button for you:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Button</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
    }
    button {
      padding: 12px 24px;
      font-size: 16px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #2563EB;
    }
  </style>
</head>
<body>
  <button onclick="alert('Clicked!')">Click Me</button>
</body>
</html>
\`\`\`

This button is centered, has modern styling, and shows an alert when clicked."

## Remember:
- Keep it SIMPLE
- Code goes INSIDE backticks ONLY
- Explanations go OUTSIDE
- Use clean, modern design
- Make it responsive
- Test that layout works in small space

## GENERAL CONVERSATION:

When the user is NOT asking for code:
• Answer questions directly and helpfully
• Provide technical guidance and explanations
• Suggest solutions and best practices
• Be conversational yet professional
• Draw on your expertise to provide value
• Ask clarifying questions when needed
• Engage in back-and-forth discussion naturally

## RESPONSE STYLE:

• **Code requests** → Generate complete, working code with brief explanation
• **Questions** → Provide clear, concise answers with examples if helpful
• **Discussion** → Engage naturally, offer insights, ask follow-ups
• **Technical help** → Diagnose issues, suggest solutions, explain concepts
• **General chat** → Be helpful, professional, and conversational

You are a technical partner who can both build AND discuss. Adapt your response to what the user needs.`;

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
            model: 'claude-sonnet-4-20250514',
            max_tokens: max_tokens,
            temperature: temperature,
            system: systemPrompt,
            messages: messages,
            stream: true
            // Note: Thinking disabled - can re-enable if needed
            // thinking: {
            //   type: 'enabled',
            //   budget_tokens: 2000
            // }
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

