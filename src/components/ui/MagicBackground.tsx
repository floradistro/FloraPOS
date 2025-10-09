'use client';

import React, { useEffect, useRef } from 'react';

interface MagicBackgroundProps {
  htmlCode: string;
}

/**
 * Renders custom HTML backgrounds behind menu content
 */
export const MagicBackground: React.FC<MagicBackgroundProps> = ({ htmlCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('🖼️ MagicBackground render, has code:', !!htmlCode, 'length:', htmlCode?.length || 0);

  useEffect(() => {
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

  }, [htmlCode]);

  if (!htmlCode) {
    console.log('⚠️ MagicBackground: Early return - no code');
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="magic-background-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    />
  );
};

