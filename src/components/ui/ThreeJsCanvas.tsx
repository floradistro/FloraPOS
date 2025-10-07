'use client';

import React, { Suspense, useEffect, useState } from 'react';

// Default Three.js scene component
const DefaultScene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </>
  );
};

interface ThreeJsCanvasProps {
  SceneComponent?: React.ComponentType | null;
}

export const ThreeJsCanvas: React.FC<ThreeJsCanvasProps> = ({ SceneComponent }) => {
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [Canvas, setCanvas] = useState<any>(null);
  const [OrbitControls, setOrbitControls] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadThreeJs = async () => {
      try {
        // Load Three.js modules dynamically
        const [fiberModule, dreiModule] = await Promise.all([
          import('@react-three/fiber'),
          import('@react-three/drei')
        ]);
        
        if (mounted) {
          setCanvas(() => fiberModule.Canvas);
          setOrbitControls(() => dreiModule.OrbitControls);
          setIsClient(true);
        }
      } catch (error) {
        console.error('Failed to load Three.js modules:', error);
        if (mounted) {
          setHasError(true);
          setIsClient(true);
        }
      }
    };

    loadThreeJs();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Loading 3D renderer...</span>
        </div>
      </div>
    );
  }

  if (hasError || !Canvas || !OrbitControls) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs" style={{ fontFamily: 'Tiempo, serif' }}>3D renderer unavailable</span>
        </div>
      </div>
    );
  }

  try {
    return (
      <Canvas 
        camera={{ position: [3, 3, 3], fov: 50 }}
        onCreated={(state: any) => {
          // Ensure the canvas is properly initialized
          state.gl.setSize(state.size.width, state.size.height);
        }}
      >
        <Suspense fallback={null}>
          {SceneComponent ? <SceneComponent /> : <DefaultScene />}
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          <gridHelper args={[10, 10]} />
        </Suspense>
      </Canvas>
    );
  } catch (error) {
    console.error('Three.js Canvas Error:', error);
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs" style={{ fontFamily: 'Tiempo, serif' }}>3D renderer error</span>
        </div>
      </div>
    );
  }
};

