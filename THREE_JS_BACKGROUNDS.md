# Three.js 3D Backgrounds for TV Menu System

## Overview

The TV Menu system now supports complex, animated 3D backgrounds powered by Three.js and WebGL. These backgrounds render in real-time with smooth animations and can be applied to both preview menus and live TV displays.

## Features

✨ **5 Scene Types:**
- **Particles** - Animated particle clouds with customizable colors
- **Waves** - Flowing wave grids (perfect for modern tech aesthetics)
- **Geometric** - Floating 3D shapes (spheres, cubes, torus, torus knots)
- **Starfield** - Space-themed starfield with depth
- **Mixed** - Combination of particles and waves

🎨 **Pre-built Templates:**
- 20+ pre-configured scenes in different color schemes
- Organized by category for easy selection
- One-click application

⚡ **Performance Optimized:**
- Hardware-accelerated WebGL rendering
- Efficient particle systems
- No impact on menu functionality
- Transparent background support

## How to Use

### Method 1: UI Selection (Easiest)

1. Open the TV Menu preview
2. Click **Magic BG** in the toolbar
3. Select the **🎮 3D Scenes** tab
4. Choose from available categories:
   - Particles
   - Waves
   - Geometric
   - Starfield
   - Mixed
5. Click any scene to apply instantly

### Method 2: Code Editor

You can manually paste Three.js scene code in the Code Editor tab:

```
THREE_JS_SCENE
{
  "type": "particles",
  "color": "#4444ff",
  "count": 5000
}
```

### Method 3: AI Designer

Ask the AI to create HTML backgrounds (Three.js integration with AI coming soon).

## Scene Configuration

### Particles Scene
```json
{
  "type": "particles",
  "color": "#4444ff",  // Hex color
  "count": 5000        // Number of particles (1000-10000)
}
```

### Waves Scene
```json
{
  "type": "waves",
  "color": "#00ffff"   // Hex color for grid
}
```

### Geometric Scene
```json
{
  "type": "geometric",
  "color": "#ff4444"   // Hex color for shapes
}
```

### Starfield Scene
```json
{
  "type": "starfield",
  "color": "#ffffff",  // Star color
  "count": 5000        // Number of stars
}
```

### Mixed Scene
```json
{
  "type": "mixed",
  "color": "#6666ff",  // Base color
  "count": 2000        // Particle count
}
```

## Technical Details

### Components

1. **MagicBackground.tsx**
   - Enhanced to detect Three.js scenes
   - Routes to appropriate renderer (HTML or Three.js)

2. **ThreeBackground.tsx**
   - WebGL renderer using React Three Fiber
   - Handles all 3D scene types
   - Optimized for TV displays

3. **three-scenes.ts**
   - Library of pre-built scene templates
   - Helper functions for scene management

### Integration Points

- ✅ **Menu Preview** - Renders in preview window
- ✅ **Live TV Display** - Works on actual TV screens
- ✅ **Menu Toolbar** - Integrated in Magic BG dropdown
- ✅ **SharedMenuDisplay** - Works in shared preview mode

### Performance Characteristics

- **GPU Accelerated** - Uses WebGL for rendering
- **60 FPS Target** - Smooth animations on modern hardware
- **Low CPU Usage** - Offloads to GPU
- **Memory Efficient** - Particle systems optimized

## Customization

### Creating Custom Scenes

You can create custom scenes by extending the templates:

```typescript
import { threeSceneTemplates } from '@/lib/three-scenes';

// Custom particle scene
const myScene = threeSceneTemplates.particles('#ff00ff', 8000);

// Apply to menu
onChange(myScene);
```

### Color Schemes

Popular color combinations:
- **Neon**: `#ff00ff`, `#00ffff`, `#ffff00`
- **Ocean**: `#0088ff`, `#00ccff`, `#00ffff`
- **Sunset**: `#ff6600`, `#ff3366`, `#9933ff`
- **Forest**: `#00ff88`, `#00cc66`, `#44ff44`
- **Galaxy**: `#9933ff`, `#6666ff`, `#3366ff`

## Browser Compatibility

✅ **Supported:**
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Modern Smart TV browsers

⚠️ **Requirements:**
- WebGL 2.0 support
- Hardware acceleration enabled
- Minimum 2GB VRAM recommended

## Troubleshooting

### Scene Not Rendering

1. Check browser console for WebGL errors
2. Verify hardware acceleration is enabled
3. Try a simpler scene (starfield or particles with lower count)

### Performance Issues

1. Reduce particle count (try 2000 instead of 5000)
2. Use simpler scene types (particles, starfield)
3. Close other GPU-intensive applications

### Black Screen

1. Check if WebGL is supported: Visit `chrome://gpu`
2. Update graphics drivers
3. Try a different browser

## Examples

### Example 1: Vibrant Neon Particles
```json
THREE_JS_SCENE
{
  "type": "particles",
  "color": "#ff00ff",
  "count": 8000
}
```

### Example 2: Calming Ocean Waves
```json
THREE_JS_SCENE
{
  "type": "waves",
  "color": "#0088ff"
}
```

### Example 3: Cosmic Mix
```json
THREE_JS_SCENE
{
  "type": "mixed",
  "color": "#9933ff",
  "count": 4000
}
```

## Future Enhancements

🔮 **Coming Soon:**
- AI-generated Three.js scenes
- Custom scene editor
- Scene transition effects
- Interactive particles
- Audio-reactive animations
- Custom shader support

## API Reference

### threeSceneTemplates

```typescript
import { threeSceneTemplates } from '@/lib/three-scenes';

// Get a specific template
const scene = threeSceneTemplates.particles('#4444ff', 5000);

// Available templates:
// - particles(color, count)
// - waves(color)
// - geometric(color)
// - starfield(color, count)
// - mixed(color, count)
// - neonParticles
// - oceanWaves
// - goldParticles
// - purpleNebula
// - greenTech
```

### Helper Functions

```typescript
import { isThreeJsScene, getSceneInfo } from '@/lib/three-scenes';

// Check if code is a Three.js scene
const isThree = isThreeJsScene(code);

// Extract scene configuration
const config = getSceneInfo(code);
// Returns: { type: string, color: string, count?: number }
```

## Performance Tips

1. **For TVs with limited GPU:**
   - Use particle count < 3000
   - Prefer simpler scenes (particles, starfield)

2. **For high-end displays:**
   - Can handle 8000+ particles
   - Use mixed scenes for stunning effects

3. **For multiple TVs:**
   - Test scene on one TV first
   - Use same scene across all TVs for consistency

## Support

For issues or questions:
1. Check browser console for errors
2. Verify WebGL support
3. Try different scene types
4. Reduce complexity (lower particle count)

---

**Built with:** React Three Fiber, Three.js, WebGL 2.0
**Compatible with:** Flora POS TV Menu System

