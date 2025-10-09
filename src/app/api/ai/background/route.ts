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

## PURE THREE.JS CODE FORMAT:

\`\`\`javascript
CUSTOM_THREE_SCENE

// Create your objects and add to scene
const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0xff6600,
  emissive: 0xff4400,
  emissiveIntensity: 0.8
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Define animation function (receives elapsed time in seconds)
function animate(time) {
  sphere.rotation.y = time * 0.5;
  sphere.position.y = Math.sin(time * 2) * 3;
}
\`\`\`

## KEY POINTS:
- Use **new THREE.Something()** syntax (NOT JSX!)
- Add objects with **scene.add(object)**
- Return nothing - just create objects
- Define **function animate(time)** for animations
- Colors are **hex numbers**: 0xff0000 (NOT strings)

## SYNTAX EXAMPLES:

**Particle System:**
- Create BufferGeometry and fill Float32Array with positions
- Use PointsMaterial with blending for glow
- Add to scene with scene.add()

**Spiral of Meshes:**
- Loop to create meshes in mathematical pattern
- Use Fibonacci or parametric equations for positions
- Group related objects with THREE.Group()

**Animation:**
- Define function animate(time) to animate objects
- Use time for smooth, continuous motion
- Access object properties directly (rotation, position, scale)

## CREATIVE GUIDELINES:

1. **Think Procedural** - Generate patterns mathematically
2. **Layer Effects** - Combine geometry + particles + lines
3. **Dynamic Motion** - Objects should flow, pulse, dance
4. **Color Theory** - Use emissive materials for glow
5. **Build Formations** - Create structured patterns, not random

## CREATIVE TECHNIQUES:

**Mathematical Patterns:**
- Fibonacci spirals
- Lissajous curves  
- Fractal patterns
- Wave equations

**Visual Effects:**
- Particle systems with structure
- Morphing geometries
- Vortex/spiral formations
- Connected webs/networks

## EXAMPLE IDEAS (Get creative!):**
- **Haunted Vortex**: Pumpkins in Fibonacci spiral
- **Spirit Web**: Interconnected glowing nodes
- **Fractal Tree**: Recursive branching
- **Kaleidoscope**: Symmetrical rotating patterns

## BANNED:**
❌ Random position loops without structure
❌ Simple floating spheres
❌ Generic particle clouds

## COMPLETE EXAMPLE - Halloween Haunted Vortex:

\`\`\`javascript
CUSTOM_THREE_SCENE

// Create pumpkin vortex using Fibonacci spiral
const pumpkinGroup = new THREE.Group();
const pumpkinCount = 30;

for (let i = 0; i < pumpkinCount; i++) {
  const t = i / pumpkinCount;
  const angle = i * Math.PI * (3 - Math.sqrt(5)); // Fibonacci
  const radius = t * 20;
  const height = (t - 0.5) * 15;
  
  const geo = new THREE.SphereGeometry(0.5 + t * 0.5, 16, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 1 - t * 0.5
  });
  const pumpkin = new THREE.Mesh(geo, mat);
  pumpkin.position.set(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius
  );
  pumpkinGroup.add(pumpkin);
}
scene.add(pumpkinGroup);

// Add ghost particle trail
const ghostCount = 2000;
const ghostGeo = new THREE.BufferGeometry();
const ghostPositions = new Float32Array(ghostCount * 3);

for (let i = 0; i < ghostCount; i++) {
  const angle = (i / ghostCount) * Math.PI * 4;
  const radius = 5 + (i / ghostCount) * 10;
  ghostPositions[i * 3] = Math.cos(angle) * radius;
  ghostPositions[i * 3 + 1] = Math.sin(angle * 2) * 10;
  ghostPositions[i * 3 + 2] = Math.sin(angle) * radius;
}

ghostGeo.setAttribute('position', new THREE.BufferAttribute(ghostPositions, 3));
const ghostMat = new THREE.PointsMaterial({
  color: 0xaa00ff,
  size: 0.2,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending
});
const ghosts = new THREE.Points(ghostGeo, ghostMat);
scene.add(ghosts);

// Animation
function animate(time) {
  pumpkinGroup.rotation.y = time * 0.3;
  ghosts.rotation.y = -time * 0.5;
  
  // Pulse pumpkins
  pumpkinGroup.children.forEach((pumpkin, i) => {
    pumpkin.rotation.y = time + i;
    pumpkin.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.2);
  });
}
\`\`\`

## RULES:
1. START with "CUSTOM_THREE_SCENE"
2. Use pure THREE.js (new THREE.Mesh, etc.)
3. Add objects to scene with scene.add()
4. Define function animate(time) for animation
5. Colors are hex numbers: 0xff0000
6. BE CREATIVE - use math patterns!

## FOR SIMPLE BACKGROUNDS:
\`\`\`html
<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
\`\`\`

NOW CREATE SPECTACULAR PURE THREE.JS SCENES!`;

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

