'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Three.js components to avoid SSR issues
const ThreeBackground = dynamic(() => import('./ThreeBackground').then(mod => mod.ThreeBackground), { 
  ssr: false,
  loading: () => null
});

interface MagicBackgroundProps {
  htmlCode: string;
}

/**
 * Enhanced MagicBackground - Supports both HTML and Three.js backgrounds
 * Detects Three.js scenes and renders them with proper WebGL support
 */
export const MagicBackground: React.FC<MagicBackgroundProps> = ({ htmlCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isThreeJs = htmlCode?.includes('THREE_JS_SCENE') || htmlCode?.includes('three.js');
  const isCustomScene = htmlCode?.includes('CUSTOM_THREE_SCENE');

  console.log('🖼️ MagicBackground render, has code:', !!htmlCode, 'length:', htmlCode?.length || 0, 'isThreeJs:', isThreeJs, 'isCustom:', isCustomScene);

  useEffect(() => {
    // Skip HTML injection if this is a Three.js scene
    if (isThreeJs || isCustomScene) {
      console.log('🎮 Three.js scene detected - using WebGL renderer');
      return;
    }

    console.log('🔄 MagicBackground useEffect triggered!');
    console.log('🎨 Code:', htmlCode ? htmlCode.substring(0, 100) : 'NONE');
    console.log('📦 Container exists:', !!containerRef.current);
    
    if (!htmlCode) {
      console.log('⚠️ No htmlCode provided');
      return;
    }
    
    if (!containerRef.current) {
      console.log('⚠️ Container ref not ready, will retry...');
      // Retry after a tick
      setTimeout(() => {
        if (containerRef.current && htmlCode) {
          const cleanedCode = htmlCode
            .replace(/```(?:html|jsx|tsx|javascript|react)?\n?/g, '')
            .replace(/```/g, '')
            .trim();
          containerRef.current.innerHTML = cleanedCode;
          console.log('✅ MagicBackground: HTML injected (retry), children:', containerRef.current.children.length);
        }
      }, 0);
      return;
    }

    // Clean any markdown
    const cleanedCode = htmlCode
      .replace(/```(?:html|jsx|tsx|javascript|react)?\n?/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('🧹 Cleaned code length:', cleanedCode.length);

    // Inject HTML directly
    containerRef.current.innerHTML = cleanedCode;
    
    console.log('✅ HTML injected! Children count:', containerRef.current.children.length);
    console.log('📝 First child:', containerRef.current.children[0]?.tagName);

  }, [htmlCode, isThreeJs, isCustomScene]);

  if (!htmlCode) {
    console.log('⚠️ MagicBackground: Early return - no code');
    return null;
  }

  // Render Three.js background (built-in or custom)
  if (isThreeJs || isCustomScene) {
    return (
      <Suspense fallback={null}>
        <ThreeBackground sceneCode={htmlCode} />
      </Suspense>
    );
  }

  // Render HTML background
  return (
    <div
      ref={containerRef}
      className="magic-background-container"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    />
  );
};

