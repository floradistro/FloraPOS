'use client';

import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { SaveArtifactButton } from '../ai/SaveArtifactButton';

/**
 * High-performance artifact renderer with virtual scrolling
 * Optimized for smooth 60fps streaming - matches app design system
 */

export type ArtifactLanguage = 'html' | 'react' | 'jsx' | 'javascript' | 'typescript' | 'css' | 'svg' | 'mermaid' | 'threejs';

export interface OptimizedArtifactProps {
  code: string;
  language: ArtifactLanguage;
  title?: string;
  conversationId?: number;
  messageId?: number;
  isStreaming?: boolean;
  isEditing?: boolean;
}

// Memoized code display - only re-renders when code actually changes
const CodeDisplay = memo<{ code: string; language: string; isStreaming: boolean }>(
  ({ code, language, isStreaming }) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const isScrollingRef = useRef(false);

    // Auto-scroll to bottom during streaming (smooth)
    React.useEffect(() => {
      if (!isStreaming || !codeRef.current) return;
      
      const pre = codeRef.current;
      const parent = pre.parentElement;
      if (!parent) return;

      // Only auto-scroll if user hasn't manually scrolled up
      const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 100;
      
      if (isNearBottom && !isScrollingRef.current) {
        isScrollingRef.current = true;
        
        // Use RAF for smooth 60fps scrolling
        requestAnimationFrame(() => {
          if (parent) {
            parent.scrollTop = parent.scrollHeight;
          }
          isScrollingRef.current = false;
        });
      }
    }, [code, isStreaming]);

    return (
      <pre
        ref={codeRef}
        className="text-[13px] leading-[1.6] font-mono text-neutral-200 m-0 p-4 whitespace-pre-wrap break-words"
        style={{ wordBreak: 'break-word', fontFamily: 'Monaco, Menlo, monospace' }}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    );
  },
  (prev, next) => {
    // Only re-render if code changed or streaming state changed
    return prev.code === next.code && prev.isStreaming === next.isStreaming;
  }
);
CodeDisplay.displayName = 'CodeDisplay';

// Memoized line numbers - only updates when line count changes
const LineNumbers = memo<{ lineCount: number }>(
  ({ lineCount }) => {
    const numbers = useMemo(() => {
      return Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    }, [lineCount]);

    return (
      <div className="flex-shrink-0 py-4 px-3 bg-transparent border-r border-white/[0.06] select-none">
        <pre className="text-[11px] leading-[1.6] text-right font-mono text-neutral-600 m-0 p-0" style={{ fontFamily: 'Monaco, Menlo, monospace' }}>
          {numbers}
        </pre>
      </div>
    );
  },
  (prev, next) => prev.lineCount === next.lineCount
);
LineNumbers.displayName = 'LineNumbers';

export const OptimizedArtifactRenderer: React.FC<OptimizedArtifactProps> = ({
  code,
  language,
  title = 'Code Artifact',
  conversationId,
  messageId,
  isStreaming = false,
  isEditing = false
}) => {
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasStreamingRef = useRef(false);

  // Calculate line count (memoized)
  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  // Auto-switch to preview when streaming completes (for new artifacts only)
  React.useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && !isEditing) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setView('preview');
      }, 300);
      wasStreamingRef.current = false;
      return () => clearTimeout(timer);
    }
    
    if (isStreaming) {
      setView('code');
      wasStreamingRef.current = true;
    }
  }, [isStreaming, isEditing]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Refresh preview
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Fullscreen toggle
  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Refresh iframe to apply fullscreen scaling
        setTimeout(() => setRefreshKey(prev => prev + 1), 100);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        // Refresh iframe to restore normal view
        setTimeout(() => setRefreshKey(prev => prev + 1), 100);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes (ESC key, etc.)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) setShowFullscreenMenu(false);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide menu after inactivity in fullscreen
  React.useEffect(() => {
    if (!isFullscreen || !showFullscreenMenu) return;
    
    const timer = setTimeout(() => {
      setShowFullscreenMenu(false);
    }, 3000); // Hide after 3 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [isFullscreen, showFullscreenMenu]);

  // Generate preview HTML
  const previewHTML = useMemo(() => {
    if (language === 'html') {
      return code;
    }
    
    if (language === 'threejs' || language === 'javascript') {
      // Check if it's Three.js code
      const isThreeJS = code.includes('THREE') || code.includes('new Scene()');
      
      if (isThreeJS) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; overflow: hidden; background: #000; }
    canvas { display: block; width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    window.THREE = THREE;
    window.OrbitControls = OrbitControls;
    
    try {
      ${code}
    } catch (err) {
      document.body.innerHTML = '<div style="color:red;padding:20px;">Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
      }
    }
    
    if (language === 'react' || language === 'jsx') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
  </script>
</body>
</html>`;
    }
    
    return `<!DOCTYPE html><html><body><pre>${code}</pre></body></html>`;
  }, [code, language]);

  // Update iframe content when preview HTML changes
  React.useEffect(() => {
    if (view === 'preview' && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(previewHTML);
        doc.close();
        
        // Inject responsive scaling for fullscreen mode
        setTimeout(() => {
          if (doc.body && isFullscreen) {
            // Add responsive CSS to fit content within viewport
            const style = doc.createElement('style');
            style.textContent = `
              /* Ensure everything stays within viewport */
              html, body {
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
              }
              
              /* Scale canvas to fit within viewport */
              canvas {
                max-width: 100vw !important;
                max-height: 100vh !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
              }
              
              /* Scale game containers to fit */
              body > div,
              .game-container {
                max-width: 100vw !important;
                max-height: 100vh !important;
                transform: scale(${Math.min(window.innerWidth / 800, window.innerHeight / 600)}) !important;
                transform-origin: center center !important;
              }
            `;
            doc.head.appendChild(style);
          }
        }, 50);
      }
    }
  }, [previewHTML, view, refreshKey, isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full overflow-hidden ${
        isFullscreen 
          ? 'bg-black' 
          : 'bg-transparent rounded-lg border border-white/[0.06]'
      }`}
    >
      {/* Header - matches app style - compact in fullscreen */}
      <div className={`flex items-center justify-between border-b border-white/[0.06] ${
        isFullscreen 
          ? 'px-2 py-1.5 bg-black/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300'
          : 'px-4 py-3 bg-transparent'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
            {title}
          </span>
          {isStreaming && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                Streaming...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher - matches app tab style */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('code')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 ease-out border ${
                view === 'code'
                  ? 'bg-neutral-800/40 text-white border-neutral-500/30'
                  : 'bg-transparent text-neutral-400 border-transparent hover:text-neutral-300 hover:bg-neutral-600/10'
              }`}
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              Code
            </button>
            <button
              onClick={() => setView('preview')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 ease-out border ${
                view === 'preview'
                  ? 'bg-neutral-800/40 text-white border-neutral-500/30'
                  : 'bg-transparent text-neutral-400 border-transparent hover:text-neutral-300 hover:bg-neutral-600/10'
              }`}
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              Preview
            </button>
          </div>

          {/* Actions - matches app button style */}
          {view === 'code' && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg transition-all duration-300 ease-out"
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          )}
          
          {view === 'preview' && (
            <>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg transition-all duration-300 ease-out"
                style={{ fontFamily: 'Tiempo, serif' }}
              >
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </span>
              </button>
              
              <button
                onClick={handleFullscreen}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 rounded-lg transition-all duration-300 ease-out"
                style={{ fontFamily: 'Tiempo, serif' }}
                title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
              >
                <span className="flex items-center gap-1">
                  {isFullscreen ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </span>
              </button>
            </>
          )}

          {!isStreaming && conversationId && (
            <SaveArtifactButton
              code={code}
              language={language}
              artifactType="code"
              title={title}
              conversationId={conversationId}
              messageId={messageId}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden bg-transparent ${
        isFullscreen ? 'w-screen h-screen' : ''
      }`}>
        {view === 'code' ? (
          <div className="flex h-full overflow-hidden">
            <LineNumbers lineCount={lineCount} />
            <div className="flex-1 overflow-auto">
              <CodeDisplay code={code} language={language} isStreaming={isStreaming} />
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={refreshKey}
            className={`border-0 bg-white ${
              isFullscreen ? 'w-screen h-screen' : 'w-full h-full'
            }`}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Preview"
          />
        )}
      </div>

      {/* Floating Action Button Menu for Fullscreen */}
      {isFullscreen && view === 'preview' && (
        <>
          {/* FAB Button */}
          <button
            onClick={() => setShowFullscreenMenu(!showFullscreenMenu)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full shadow-2xl z-[100] flex items-center justify-center transition-all duration-300 ease-out border-2 border-neutral-600 hover:scale-110 active:scale-95"
            style={{ fontFamily: 'Tiempo, serif' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Expandable Menu */}
          {showFullscreenMenu && (
            <div className="fixed bottom-24 right-6 bg-neutral-900/95 backdrop-blur-lg rounded-2xl shadow-2xl z-[100] border border-neutral-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="p-2 space-y-1 min-w-[200px]">
                {/* Exit Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 rounded-xl transition-colors text-left"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Exit Fullscreen</span>
                  <span className="ml-auto text-xs text-neutral-500">ESC</span>
                </button>

                {/* Refresh */}
                <button
                  onClick={() => {
                    handleRefresh();
                    setShowFullscreenMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 rounded-xl transition-colors text-left"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">Refresh</span>
                </button>

                {/* View Code */}
                <button
                  onClick={() => {
                    setView('code');
                    setShowFullscreenMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 rounded-xl transition-colors text-left"
                  style={{ fontFamily: 'Tiempo, serif' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm">View Code</span>
                </button>
              </div>
            </div>
          )}

          {/* Tap anywhere to close menu */}
          {showFullscreenMenu && (
            <div 
              className="fixed inset-0 z-[99]" 
              onClick={() => setShowFullscreenMenu(false)}
            />
          )}
        </>
      )}
    </div>
  );
};
