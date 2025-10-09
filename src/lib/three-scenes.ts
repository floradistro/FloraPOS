/**
 * Three.js Scene Templates for TV Menu Backgrounds
 * 
 * Usage: Pass any of these templates as the customBackground in MenuToolbar
 * The system will automatically detect "THREE_JS_SCENE" and render with WebGL
 */

export const threeSceneTemplates = {
  /**
   * Animated particle field with glowing dots
   */
  particles: (color: string = '#4444ff', count: number = 5000) => `
THREE_JS_SCENE
{
  "type": "particles",
  "color": "${color}",
  "count": ${count}
}
  `.trim(),

  /**
   * Flowing wave grid - great for modern tech feel
   */
  waves: (color: string = '#00ffff') => `
THREE_JS_SCENE
{
  "type": "waves",
  "color": "${color}"
}
  `.trim(),

  /**
   * Floating geometric shapes
   */
  geometric: (color: string = '#ff4444') => `
THREE_JS_SCENE
{
  "type": "geometric",
  "color": "${color}"
}
  `.trim(),

  /**
   * Starfield - perfect for space/modern themes
   */
  starfield: (color: string = '#ffffff', count: number = 5000) => `
THREE_JS_SCENE
{
  "type": "starfield",
  "color": "${color}",
  "count": ${count}
}
  `.trim(),

  /**
   * Mixed scene - particles + waves
   */
  mixed: (color: string = '#6666ff', count: number = 2000) => `
THREE_JS_SCENE
{
  "type": "mixed",
  "color": "${color}",
  "count": ${count}
}
  `.trim(),

  /**
   * Neon particles - vibrant and energetic
   */
  neonParticles: () => `THREE_JS_SCENE
{
  "type": "particles",
  "color": "#ff00ff",
  "count": 8000
}`,

  /**
   * Ocean waves - calm blue waves
   */
  oceanWaves: () => `THREE_JS_SCENE
{
  "type": "waves",
  "color": "#0088ff"
}`,

  /**
   * Gold particles - premium feel
   */
  goldParticles: () => `THREE_JS_SCENE
{
  "type": "particles",
  "color": "#ffd700",
  "count": 6000
}`,

  /**
   * Purple nebula
   */
  purpleNebula: () => `THREE_JS_SCENE
{
  "type": "mixed",
  "color": "#9933ff",
  "count": 4000
}`,

  /**
   * Green tech grid
   */
  greenTech: () => `THREE_JS_SCENE
{
  "type": "waves",
  "color": "#00ff88"
}`,

  /**
   * Tunnel - hypnotic rotating tunnel
   */
  tunnel: (color: string = '#00ffff') => `THREE_JS_SCENE
{
  "type": "tunnel",
  "color": "${color}"
}`,

  /**
   * Vortex - swirling energy vortex
   */
  vortex: (color: string = '#9933ff') => `THREE_JS_SCENE
{
  "type": "vortex",
  "color": "${color}"
}`,

  /**
   * DNA Helix - rotating double helix
   */
  dnaHelix: (color: string = '#00ff88') => `THREE_JS_SCENE
{
  "type": "dna",
  "color": "${color}"
}`,

  /**
   * Galaxy - spiral galaxy with stars
   */
  galaxy: (color: string = '#6666ff') => `THREE_JS_SCENE
{
  "type": "galaxy",
  "color": "${color}",
  "count": 10000
}`,

  /**
   * Matrix Rain - falling code effect
   */
  matrixRain: (color: string = '#00ff00') => `THREE_JS_SCENE
{
  "type": "matrix",
  "color": "${color}"
}`,

  /**
   * Plasma - organic plasma effect
   */
  plasma: (color: string = '#ff00ff') => `THREE_JS_SCENE
{
  "type": "plasma",
  "color": "${color}"
}`,

  /**
   * Rings - rotating orbital rings
   */
  rings: (color: string = '#ffaa00') => `THREE_JS_SCENE
{
  "type": "rings",
  "color": "${color}"
}`,

  /**
   * Nebula - colorful space nebula
   */
  nebula: (color: string = '#ff00ff') => `THREE_JS_SCENE
{
  "type": "nebula",
  "color": "${color}",
  "count": 8000
}`,

  /**
   * Gradient Waves - flowing waves with color gradients
   */
  gradientWaves: (color1: string = '#ff00ff', color2: string = '#00ffff') => `THREE_JS_SCENE
{
  "type": "gradientWaves",
  "color": "${color1}",
  "color2": "${color2}"
}`
};

/**
 * Get a random Three.js scene
 */
export function getRandomThreeScene(): string {
  const scenes = Object.values(threeSceneTemplates);
  const randomIndex = Math.floor(Math.random() * scenes.length);
  const scene = scenes[randomIndex];
  return typeof scene === 'function' ? scene() : scene;
}

/**
 * Scene categories for UI selection
 */
export const threeSceneCategories = {
  'Particles': [
    { name: 'Blue Particles', code: threeSceneTemplates.particles('#4444ff', 5000) },
    { name: 'Neon Particles', code: threeSceneTemplates.neonParticles() },
    { name: 'Gold Particles', code: threeSceneTemplates.goldParticles() },
    { name: 'Purple Particles', code: threeSceneTemplates.particles('#9933ff', 6000) },
    { name: 'Green Particles', code: threeSceneTemplates.particles('#00ff88', 5000) },
    { name: 'Cyan Particles', code: threeSceneTemplates.particles('#00ffff', 5000) }
  ],
  'Waves': [
    { name: 'Cyan Waves', code: threeSceneTemplates.waves('#00ffff') },
    { name: 'Ocean Waves', code: threeSceneTemplates.oceanWaves() },
    { name: 'Green Tech', code: threeSceneTemplates.greenTech() },
    { name: 'Red Waves', code: threeSceneTemplates.waves('#ff3333') },
    { name: 'Purple Waves', code: threeSceneTemplates.waves('#9933ff') },
    { name: 'Gold Waves', code: threeSceneTemplates.waves('#ffd700') },
    { name: '🌊 Sunset Gradient', code: threeSceneTemplates.gradientWaves('#ff6b6b', '#ffd93d') },
    { name: '🌊 Ocean Gradient', code: threeSceneTemplates.gradientWaves('#00d2ff', '#3a47d5') },
    { name: '🌊 Purple Dream', code: threeSceneTemplates.gradientWaves('#667eea', '#764ba2') },
    { name: '🌊 Pink Paradise', code: threeSceneTemplates.gradientWaves('#ff0084', '#33001b') },
    { name: '🌊 Cyber Wave', code: threeSceneTemplates.gradientWaves('#00ff88', '#00d4ff') },
    { name: '🌊 Fire Wave', code: threeSceneTemplates.gradientWaves('#ff0000', '#ff9900') }
  ],
  'Geometric': [
    { name: 'Red Shapes', code: threeSceneTemplates.geometric('#ff4444') },
    { name: 'Blue Shapes', code: threeSceneTemplates.geometric('#4444ff') },
    { name: 'Gold Shapes', code: threeSceneTemplates.geometric('#ffd700') },
    { name: 'Cyan Shapes', code: threeSceneTemplates.geometric('#00ffff') },
    { name: 'Purple Shapes', code: threeSceneTemplates.geometric('#9933ff') }
  ],
  'Starfield': [
    { name: 'White Stars', code: threeSceneTemplates.starfield('#ffffff', 5000) },
    { name: 'Blue Stars', code: threeSceneTemplates.starfield('#4488ff', 6000) },
    { name: 'Dense Stars', code: threeSceneTemplates.starfield('#ffffff', 10000) },
    { name: 'Purple Stars', code: threeSceneTemplates.starfield('#9933ff', 5000) }
  ],
  'Advanced': [
    { name: 'Cyan Tunnel', code: threeSceneTemplates.tunnel('#00ffff') },
    { name: 'Purple Vortex', code: threeSceneTemplates.vortex('#9933ff') },
    { name: 'DNA Helix', code: threeSceneTemplates.dnaHelix('#00ff88') },
    { name: 'Spiral Galaxy', code: threeSceneTemplates.galaxy('#6666ff') },
    { name: 'Matrix Rain', code: threeSceneTemplates.matrixRain('#00ff00') },
    { name: 'Plasma Field', code: threeSceneTemplates.plasma('#ff00ff') },
    { name: 'Orbital Rings', code: threeSceneTemplates.rings('#ffaa00') },
    { name: 'Cosmic Nebula', code: threeSceneTemplates.nebula('#ff00ff') }
  ],
  'Mixed': [
    { name: 'Purple Nebula', code: threeSceneTemplates.purpleNebula() },
    { name: 'Cyan Galaxy', code: threeSceneTemplates.mixed('#00ffff', 3000) },
    { name: 'Gold Cosmos', code: threeSceneTemplates.mixed('#ffd700', 2500) },
    { name: 'Red Cosmos', code: threeSceneTemplates.mixed('#ff3333', 3000) }
  ]
};

/**
 * Check if a background code is a Three.js scene
 */
export function isThreeJsScene(code: string): boolean {
  return code?.includes('THREE_JS_SCENE') || code?.includes('three.js');
}

/**
 * Get scene info from code
 */
export function getSceneInfo(code: string): { type: string; color: string; count?: number } | null {
  if (!isThreeJsScene(code)) return null;
  
  try {
    const jsonMatch = code.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse scene info:', e);
  }
  
  return null;
}

