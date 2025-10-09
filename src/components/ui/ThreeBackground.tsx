'use client';

import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  sceneCode: string;
}

/**
 * Parse scene configuration from code string
 */
function parseSceneConfig(sceneCode: string): any {
  try {
    // Look for JSON config in the code
    const jsonMatch = sceneCode.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse scene config:', e);
  }
  
  // Default configuration
  return {
    type: 'particles',
    color: '#4444ff',
    count: 5000
  };
}

/**
 * Pure Three.js Custom Scene Renderer
 */
function PureThreeScene({ sceneCode }: { sceneCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🎮 Initializing Pure Three.js scene');
    console.log('📝 Code length:', sceneCode.length);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    cameraRef.current = camera;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Execute custom scene code
    try {
      console.log('🚀 Executing custom scene code...');
      
      // Create animation function reference
      let animateFunction: ((time: number) => void) | null = null;

      // Execute the user's code with scene, camera, and THREE available
      const sceneSetup = new Function('scene', 'camera', 'THREE', `
        ${sceneCode}
        
        // Return the animate function if it exists
        return typeof animate === 'function' ? animate : null;
      `);

      animateFunction = sceneSetup(scene, camera, THREE);
      console.log('✅ Scene code executed, has animate function:', !!animateFunction);

      // Animation loop
    const clock = new THREE.Clock();
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

        // Call custom animate function if provided
        if (animateFunction) {
          animateFunction(elapsedTime);
        }

      renderer.render(scene, camera);
    };

    animate();

    } catch (error) {
      console.error('❌ Failed to execute custom scene:', error);
      
      // Fallback: red error cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
    }

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [sceneCode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    />
  );
}

/**
 * Animated Particles Scene
 */
function ParticlesScene({ color = '#4444ff', count = 5000 }: { color?: string; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
      // Random positions in a sphere
      const radius = Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Vary colors slightly
      const colorVariation = new THREE.Color(baseColor);
      colorVariation.offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2 - 0.1);
      
      colors[i * 3] = colorVariation.r;
      colors[i * 3 + 1] = colorVariation.g;
      colors[i * 3 + 2] = colorVariation.b;
    }
    
    return { positions, colors };
  }, [count, color]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Animated Wave Grid
 */
function WaveGrid({ color = '#00ffff' }: { color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridSize = 50;
  const segments = 100;

  useFrame((state) => {
    if (meshRef.current && meshRef.current.geometry) {
      const geometry = meshRef.current.geometry;
      const position = geometry.attributes.position;
      
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const time = state.clock.elapsedTime;
        
        const wave1 = Math.sin(x * 0.5 + time) * 2;
        const wave2 = Math.sin(y * 0.5 + time * 1.2) * 2;
        const wave3 = Math.sin((x + y) * 0.3 + time * 0.8) * 1;
        
        position.setZ(i, wave1 + wave2 + wave3);
      }
      
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[gridSize, gridSize, segments, segments]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/**
 * Floating Geometries
 */
function FloatingGeometry({ type = 'sphere', position, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 2;
    }
  });

  const geometries: Record<string, JSX.Element> = {
    sphere: <sphereGeometry args={[1, 32, 32]} />,
    box: <boxGeometry args={[2, 2, 2]} />,
    torus: <torusGeometry args={[1, 0.4, 16, 100]} />,
    torusknot: <torusKnotGeometry args={[1, 0.3, 100, 16]} />
  };
  const geometry = geometries[type] || geometries['sphere'];

  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

/**
 * Geometric Shapes Scene
 */
function GeometricScene({ color = '#ff4444' }: { color?: string }) {
  const shapes = [
    { type: 'sphere', position: [-8, 0, -5], color: color },
    { type: 'box', position: [-3, 0, -5], color: color },
    { type: 'torus', position: [3, 0, -5], color: color },
    { type: 'torusknot', position: [8, 0, -5], color: color },
  ];

  return (
    <>
      {shapes.map((shape, i) => (
        <FloatingGeometry key={i} {...shape} />
      ))}
    </>
  );
}

/**
 * Starfield Scene
 */
function StarfieldScene({ color = '#ffffff', count = 5000 }: { color?: string; count?: number }) {
  return (
    <Stars
      radius={100}
      depth={50}
      count={count}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
}

/**
 * Tunnel Scene - Hypnotic rotating tunnel
 */
function TunnelScene({ color = '#00ffff' }: { color?: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const rings = 50;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      {Array.from({ length: rings }).map((_, i) => {
        const z = -i * 2;
        const scale = 1 + i * 0.1;
        return (
          <mesh key={i} position={[0, 0, z]}>
            <torusGeometry args={[scale, 0.1, 16, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              transparent
              opacity={1 - i / rings}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Vortex Scene - Swirling energy vortex
 */
function VortexScene({ color = '#9933ff' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const spirals = 3;
  const particlesPerSpiral = 200;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: spirals }).map((_, spiralIdx) => (
        <group key={spiralIdx} rotation={[0, (spiralIdx * Math.PI * 2) / spirals, 0]}>
          {Array.from({ length: particlesPerSpiral }).map((_, i) => {
            const t = i / particlesPerSpiral;
            const radius = t * 15;
            const angle = t * Math.PI * 8;
            const x = Math.cos(angle) * radius;
            const y = (t - 0.5) * 20;
            const z = Math.sin(angle) * radius;
            
            return (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.8}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/**
 * DNA Helix Scene
 */
function DNAHelixScene({ color = '#00ff88' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const segments = 100;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Helix 1 */}
      {Array.from({ length: segments }).map((_, i) => {
        const t = (i / segments) * Math.PI * 4;
        const x = Math.cos(t) * 3;
        const y = (i / segments - 0.5) * 20;
        const z = Math.sin(t) * 3;
        
        return (
          <mesh key={`helix1-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
      
      {/* Helix 2 */}
      {Array.from({ length: segments }).map((_, i) => {
        const t = (i / segments) * Math.PI * 4;
        const x = Math.cos(t + Math.PI) * 3;
        const y = (i / segments - 0.5) * 20;
        const z = Math.sin(t + Math.PI) * 3;
        
        return (
          <mesh key={`helix2-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
      
      {/* Connecting bars */}
      {Array.from({ length: Math.floor(segments / 4) }).map((_, i) => {
        const idx = i * 4;
        const t = (idx / segments) * Math.PI * 4;
        const y = (idx / segments - 0.5) * 20;
        
        return (
          <mesh key={`bar-${i}`} position={[0, y, 0]} rotation={[0, t, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 6, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Galaxy Scene - Spiral galaxy
 */
function GalaxyScene({ color = '#6666ff', count = 10000 }: { color?: string; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 30;
      const spinAngle = radius * 0.3;
      const branchAngle = ((i % 3) / 3) * Math.PI * 2;
      
      const randomX = (Math.random() - 0.5) * 2;
      const randomY = (Math.random() - 0.5) * 2;
      const randomZ = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i * 3 + 1] = randomY;
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
      
      const mixedColor = baseColor.clone();
      mixedColor.offsetHSL(Math.random() * 0.2 - 0.1, 0, Math.random() * 0.3);
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    return { positions, colors };
  }, [count, color]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Matrix Rain Scene
 */
function MatrixRainScene({ color = '#00ff00' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const columns = 30;
  const rows = 50;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y = ((state.clock.elapsedTime * 2 + i) % 50) - 25;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: columns }).map((_, col) => {
        const x = (col - columns / 2) * 2;
        const z = -20;
        
        return (
          <group key={col}>
            {Array.from({ length: rows }).map((_, row) => {
              const y = (row - rows / 2) * 1;
              
              return (
                <mesh key={row} position={[x, y, z]}>
                  <boxGeometry args={[0.3, 0.8, 0.1]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={Math.random() * 0.5}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Plasma Scene
 */
function PlasmaScene({ color = '#ff00ff' }: { color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.geometry) {
      const geometry = meshRef.current.geometry;
      const position = geometry.attributes.position;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        
        const wave1 = Math.sin(x * 0.3 + time * 2) * 3;
        const wave2 = Math.sin(y * 0.3 + time * 1.5) * 3;
        const wave3 = Math.sin((x + y) * 0.2 + time) * 2;
        
        position.setZ(i, wave1 + wave2 + wave3);
      }
      
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[40, 40, 64, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        wireframe={false}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

/**
 * Rings Scene - Orbital rings
 */
function RingsScene({ color = '#ffaa00' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringCount = 5;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const radius = 3 + i * 2;
        const rotation = [
          Math.PI / 2 + (i * Math.PI) / ringCount,
          (i * Math.PI) / ringCount,
          0
        ] as [number, number, number];
        
        return (
          <mesh key={i} rotation={rotation}>
            <torusGeometry args={[radius, 0.1, 16, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Nebula Scene
 */
function NebulaScene({ color = '#ff00ff', count = 8000 }: { color?: string; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
      // Create cloud-like distribution
      const radius = Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = radius * Math.cos(phi) + (Math.random() - 0.5) * 10;
      
      const mixedColor = baseColor.clone();
      mixedColor.offsetHSL(Math.random() * 0.3 - 0.15, Math.random() * 0.2, Math.random() * 0.3 - 0.15);
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    return { positions, colors };
  }, [count, color]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Main Three.js Background Component
 */
export function ThreeBackground({ sceneCode }: ThreeBackgroundProps) {
  // Check if this is a custom scene
  const isCustom = sceneCode.includes('CUSTOM_THREE_SCENE');
  
  console.log('🎮 ThreeBackground received:', {
    isCustom,
    codeLength: sceneCode.length,
    codePreview: sceneCode.substring(0, 100)
  });

  // If it's a custom scene, use Pure Three.js renderer
  if (isCustom) {
    console.log('✅ Using Pure Three.js renderer for custom scene');
    return <PureThreeScene sceneCode={sceneCode} />;
  }

  // For pre-built scenes, use React Three Fiber
  const config = parseSceneConfig(sceneCode);
  const sceneType = config.type || 'particles';

  const renderScene = () => {
    switch (sceneType) {
      case 'particles':
        return <ParticlesScene color={config.color} count={config.count} />;
      
      case 'waves':
        return <WaveGrid color={config.color} />;
      
      case 'geometric':
        return <GeometricScene color={config.color} />;
      
      case 'starfield':
        return <StarfieldScene color={config.color} count={config.count} />;
      
      case 'tunnel':
        return <TunnelScene color={config.color} />;
      
      case 'vortex':
        return <VortexScene color={config.color} />;
      
      case 'dna':
        return <DNAHelixScene color={config.color} />;
      
      case 'galaxy':
        return <GalaxyScene color={config.color} count={config.count} />;
      
      case 'matrix':
        return <MatrixRainScene color={config.color} />;
      
      case 'plasma':
        return <PlasmaScene color={config.color} />;
      
      case 'rings':
        return <RingsScene color={config.color} />;
      
      case 'nebula':
        return <NebulaScene color={config.color} count={config.count} />;
      
      case 'mixed':
        return (
          <>
            <ParticlesScene color={config.color} count={config.count || 2000} />
            <WaveGrid color={config.color} />
          </>
        );
      
      default:
        return <ParticlesScene color={config.color} count={config.count} />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      <Canvas
        key={sceneCode.substring(0, 100)} // Force re-render when code changes
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient light for visibility */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Render the selected scene */}
        {renderScene()}
      </Canvas>
    </div>
  );
}
