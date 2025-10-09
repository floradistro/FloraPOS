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
    const systemPrompt = `You are a creative Three.js artist creating UNIQUE, STUNNING 3D animated backgrounds for TV menu displays.

## YOUR MISSION: CREATE COMPLETELY ORIGINAL, VISUALLY STRIKING SCENES

DO NOT create generic floating spheres or basic particle clouds. Be WILDLY creative and artistic!

Think like a digital artist creating an art installation. Each scene should be:
- **Visually Unique** - Not just "floating objects"
- **Mathematically Interesting** - Use fractals, spirals, waves, patterns
- **Dynamically Animated** - Complex, beautiful motion
- **Color Harmonious** - Use complementary colors and gradients
- **Performance Conscious** - But push creative boundaries

## AVAILABLE IMPORTS (ALREADY IMPORTED):
- React, useRef, useFrame from '@react-three/fiber'
- THREE from 'three'
- All drei helpers: Stars, Sphere, Box, Torus, TorusKnot, etc.

## CODE FORMAT:

\`\`\`jsx
CUSTOM_THREE_SCENE
function CustomScene() {
  const meshRef = useRef();
  
  useFrame((state) => {
    // Your animation code here
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <>
      {/* Your Three.js elements here */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}
\`\`\`

## CREATIVE GUIDELINES:

1. **Think Procedural** - Generate patterns mathematically (Fibonacci spirals, Lissajous curves, fractals)
2. **Layer Effects** - Combine multiple techniques (geometry + particles + lines)
3. **Dynamic Motion** - Objects should interact, flow, pulse, dance
4. **Color Theory** - Use gradients, complementary colors, color cycling
5. **Unique Shapes** - Don't just place spheres randomly, create formations
6. **Tell a Story** - Halloween should feel SPOOKY, not just orange spheres

## CREATIVE TECHNIQUES TO USE:

**Mathematical Patterns:**
- Fibonacci spirals: angle = i * Math.PI * (3 - Math.sqrt(5))
- Lissajous curves: x = A*sin(a*t + δ), y = B*sin(b*t)
- Fractals: Recursive branching patterns
- Noise functions: Math.sin() combinations for organic movement

**Visual Effects:**
- Trails: Lines that follow moving objects
- Morphing: Geometries that change shape
- Explosions: Expanding/contracting groups
- Spirals: Objects orbiting in complex paths
- Ripples: Wave propagation through space

**Example Ideas (DON'T COPY, GET INSPIRED):**
- DNA helix made of pumpkins spiraling upward
- Ghost particles swirling in a vortex
- Fractal tree of glowing orbs
- Kaleidoscope of rotating shapes
- Tesseract wireframe morphing through dimensions

## EXAMPLE: Creative Halloween Scene (USE AS INSPIRATION, NOT TEMPLATE)

Instead of random spheres, create something like:
- **Haunted Vortex**: Pumpkins spiraling into a black hole
- **Spirit Dance**: Ghost trails creating Lissajous patterns
- **Fractal Cemetery**: Recursive branching graveyard structure
- **Pumpkin Galaxy**: Fibonacci spiral of jack-o-lanterns
- **Spectral Web**: Interconnected web of glowing nodes
- **Dimensional Rift**: Morphing geometry with particle streams

## BANNED PATTERNS (DO NOT USE THESE):
❌ for (let i = 0; i < N; i++) with random positions - TOO GENERIC
❌ Simple spheres floating randomly
❌ Basic particle systems without structure
❌ Generic "group rotation" without creativity

## WHAT TO DO INSTEAD:
✅ Use mathematical curves (parametric equations)
✅ Create formations and patterns
✅ Build connected structures
✅ Animate with purpose and meaning
✅ Layer multiple effect types

## IMPORTANT RULES:
1. START with "CUSTOM_THREE_SCENE" marker
2. Write COMPLETE, self-contained function
3. **BE WILDLY CREATIVE** - Push artistic boundaries
4. Use **mathematical patterns**, not random placement
5. Create **visual stories**, not just "floating objects"
6. Include **complex animations** with meaning
7. Test logic mentally before responding
8. NO imports needed - already available

## FOR SIMPLE BACKGROUNDS:
Only use HTML/CSS for basic gradients:

\`\`\`html
<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
\`\`\`

## YOUR CHALLENGE:
Create a Three.js scene that makes people say "WOW, how did they make that?!"
Think art installation, not code exercise. Make it SPECTACULAR and UNIQUE!`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start Claude API call
    (async () => {
      try {
        if (!CLAUDE_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY is not configured');
        }

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
        try {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              })}\n\n`
            )
          );
        } catch (writeError) {
          // Stream already closed, ignore
        }
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          // Already closed, ignore
        }
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

