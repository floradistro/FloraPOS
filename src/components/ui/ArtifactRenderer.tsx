'use client';

import React, { useState } from 'react';
import { SaveArtifactButton } from '../ai/SaveArtifactButton';

/**
 * Industry-standard artifact renderer
 * Supports: HTML, React/JSX, JavaScript, CSS, SVG, Mermaid
 */

export type ArtifactLanguage = 'html' | 'react' | 'jsx' | 'javascript' | 'typescript' | 'css' | 'svg' | 'mermaid';

export interface ArtifactProps {
  code: string;
  language: ArtifactLanguage;
  title?: string;
  conversationId?: number;
  messageId?: number;
  isStreaming?: boolean;
  isEditing?: boolean;
}

// Memoized Line Numbers component for performance
const LineNumbers = React.memo<{ lines: number; changedLines: Set<number> }>(({ lines, changedLines }) => {
  // Generate line numbers as a single text block for better performance
  const lineNumbersText = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  
  return (
    <div className="flex-shrink-0 py-4 px-3 bg-[#0a0a0a] border-r border-neutral-800/30 select-none">
      <pre className="text-[11px] leading-[1.6] text-right font-mono text-neutral-600 m-0 p-0">
        {lineNumbersText}
      </pre>
    </div>
  );
}, (prev, next) => {
  // Only re-render if lines count changed (not on every changedLines update)
  return prev.lines === next.lines;
});
LineNumbers.displayName = 'LineNumbers';

// Simplified Change Indicators - disabled for performance
const ChangeIndicators = React.memo<{ lines: number; changedLines: Set<number> }>(() => null);
ChangeIndicators.displayName = 'ChangeIndicators';

// Wrap in memo to prevent unnecessary re-renders
const ArtifactRendererComponent: React.FC<ArtifactProps> = ({ 
  code, 
  language, 
  title = 'Code Artifact', 
  conversationId, 
  messageId,
  isStreaming = false,
  isEditing = false
}) => {
  const [view, setView] = useState<'preview' | 'code'>('code'); // Start with code view for live coding
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const wasStreamingRef = React.useRef(false);
  const codeContainerRef = React.useRef<HTMLDivElement>(null);
  const previousCodeRef = React.useRef<string>(code);
  const [changedLines, setChangedLines] = React.useState<Set<number>>(new Set());
  const highlightTimeoutRef = React.useRef<NodeJS.Timeout>();
  const updateThrottleRef = React.useRef<NodeJS.Timeout>();
  const scrollDebounceRef = React.useRef<NodeJS.Timeout>();
  const lastScrollTime = React.useRef<number>(0);
  
  // Only log once when component mounts, not on every render
  React.useEffect(() => {
    console.log('🎨 [ArtifactRenderer] Mounted with:', {
      title,
      language,
      codeLength: code?.length || 0,
      isStreaming,
      isEditing
    });
  }, []);

  // Simplified: no change tracking (removed for performance)
  React.useEffect(() => {
    previousCodeRef.current = code;
  }, [code]);

  // Smooth auto-scroll with debouncing - only scroll after updates settle
  React.useEffect(() => {
    if (!isStreaming || !codeContainerRef.current || view !== 'code') return;
    
    const container = codeContainerRef.current;
    const now = Date.now();
    
    // Clear any pending scroll
    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }
    
    // Debounce: wait for 50ms of no updates before scrolling
    scrollDebounceRef.current = setTimeout(() => {
      if (!container) return;
      
      // Use requestAnimationFrame for smooth 60fps update
      requestAnimationFrame(() => {
        if (container) {
          // Smooth scroll to bottom
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }, 50); // Wait 50ms after last update
    
    return () => {
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [code, isStreaming, view]);


  // Handle view switching based on streaming state
  React.useEffect(() => {
    // When editing starts, immediately switch to code view
    if (isEditing && isStreaming) {
      setView('code');
      wasStreamingRef.current = true;
      return;
    }
    
    // When streaming starts (new artifact), show code view
    if (isStreaming) {
      setView('code');
      wasStreamingRef.current = true;
    }
    
    // When streaming stops (was streaming, now not)
    else if (wasStreamingRef.current && !isStreaming) {
      // Auto-switch to preview ONLY if not editing existing artifact
      if (!isEditing) {
        // Small delay to ensure code is fully rendered
        setTimeout(() => {
          setView('preview');
        }, 500);
      }
      
      wasStreamingRef.current = false;
    }
  }, [isStreaming, isEditing]);

  // Generate HTML for iframe based on language
  const generateHTML = (code: string, lang: ArtifactLanguage): string => {
    switch (lang) {
      case 'html':
        // Check if it's a complete HTML document
        const isFullDoc = code.trim().toLowerCase().startsWith('<!doctype') || code.trim().toLowerCase().startsWith('<html');
        
        if (isFullDoc) {
          // Add CSS normalization if the document doesn't have proper resets
          if (!code.includes('box-sizing') && !code.includes('* {')) {
            // Inject normalization styles right after <head> or <style> tag
            const headEndIndex = code.indexOf('</head>');
            if (headEndIndex > -1) {
              const normalizationCSS = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>`;
              return code.slice(0, headEndIndex) + normalizationCSS + code.slice(headEndIndex);
            }
          }
          return code;
        }
        
        // If it's just HTML fragments, wrap them properly
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Artifact</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;

      case 'react':
      case 'jsx':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    ${code}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    const Component = typeof App !== 'undefined' ? App : 
      Object.values(window).find(v => typeof v === 'function' && v.name && /^[A-Z]/.test(v.name));
    
    if (Component) {
      root.render(React.createElement(Component));
    } else {
      root.render(React.createElement('div', null, 'No React component found. Make sure to export a component named App or with a capital letter.'));
    }
  </script>
</body>
</html>`;

      case 'javascript':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    ${code}
  </script>
</body>
</html>`;

      case 'typescript':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    ${code}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    const Component = typeof App !== 'undefined' ? App : 
      Object.values(window).find(v => typeof v === 'function' && v.name && /^[A-Z]/.test(v.name));
    if (Component) {
      root.render(React.createElement(Component));
    }
  </script>
</body>
</html>`;

      case 'css':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${code}
  </style>
</head>
<body>
  <div class="container">
    <h1>CSS Preview</h1>
    <p>Sample paragraph text</p>
    <button>Button</button>
    <div class="box">Box Element</div>
  </div>
</body>
</html>`;

      case 'svg':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;

      case 'mermaid':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: #fff; }
  </style>
</head>
<body>
  <div class="mermaid">
${code}
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;

      default:
        return `<!DOCTYPE html>
<html>
<body>
  <pre>${code}</pre>
</body>
</html>`;
    }
  };

  // Generate HTML content - memoized for performance
  const htmlContent = React.useMemo(() => {
    const html = generateHTML(code, language);
    
    if (!html || html.length === 0) {
      console.error('❌ [ArtifactRenderer] Generated HTML is EMPTY!');
      return '<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:red;font-family:monospace;padding:20px;text-align:center;"><div>Error: Failed to generate HTML content</div></body></html>';
    }
    
    return html;
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const ext = language === 'react' || language === 'jsx' ? 'jsx' : 
                language === 'typescript' ? 'tsx' : language;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 rounded-lg border border-neutral-800" style={{ overflow: 'hidden', contain: 'layout size style' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="px-2 py-0.5 text-xs bg-neutral-700 text-neutral-300 rounded font-mono">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex gap-1 bg-neutral-700 rounded p-1">
            <button
              onClick={() => setView('preview')}
              className={`px-3 py-1 text-xs rounded transition ${
                view === 'preview' ? 'bg-neutral-600 text-white' : 'text-neutral-400'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setView('code')}
              className={`px-3 py-1 text-xs rounded transition ${
                view === 'code' ? 'bg-neutral-600 text-white' : 'text-neutral-400'
              }`}
            >
              Code
            </button>
          </div>

          {/* Save Button */}
          <SaveArtifactButton
            code={code}
            artifactType={language}
            language={language}
            title={title}
            conversationId={conversationId}
            messageId={messageId}
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition"
            title="Refresh preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition"
            title="Copy code"
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition"
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - Fixed size, no expanding */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative" style={{ minHeight: 0 }}>
        {view === 'preview' ? (
          <iframe
            key={`iframe-${language}-${refreshKey}`}
            srcDoc={htmlContent}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-modals allow-same-origin"
            title={title}
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              border: 'none',
              margin: 0,
              padding: 0,
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        ) : (
          <div 
            ref={codeContainerRef}
            className="absolute inset-0 bg-[#0a0a0a]"
            style={{ 
              contain: 'strict',
              overflow: 'auto',
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              transform: 'translateZ(0)',
              willChange: 'scroll-position'
            }}
          >
            {/* Code Editor View - Optimized for performance */}
            <div className="flex min-h-full">
              {/* Line Numbers - Use memo to prevent re-renders */}
              <LineNumbers lines={code.split('\n').length} changedLines={changedLines} />
              
              {/* Changed Line Indicators */}
              <ChangeIndicators lines={code.split('\n').length} changedLines={changedLines} />
              
              {/* Code Content */}
              <div className="flex-1 py-4 px-4">
                <pre className="text-[13px] leading-[1.6] text-neutral-200 font-mono whitespace-pre m-0 p-0" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
{code}{isStreaming && <span className="inline-block w-[2px] h-[16px] bg-blue-500 ml-[1px] align-middle" style={{ animation: 'blink 1s infinite' }} />}
</pre>
              </div>
            </div>
            
            {/* Streaming Indicator */}
            {isStreaming && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-neutral-700/50">
                <div className="flex gap-1">
                  <div className={`w-1 h-1 rounded-full animate-bounce ${isEditing ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-1 h-1 rounded-full animate-bounce ${isEditing ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-1 h-1 rounded-full animate-bounce ${isEditing ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isEditing ? 'Editing code...' : 'Generating code...'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Animations - GPU Accelerated */}
      <style jsx>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        /* Use transform instead of background-color for better performance */
        @keyframes pulse-subtle {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.002);
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 1.5s ease-in-out infinite;
          will-change: opacity, transform;
          backface-visibility: hidden;
        }
        
        /* Enable GPU acceleration for smooth scrolling */
        pre {
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }
        
        /* Smooth scroll container with hardware acceleration */
        div[style*="contain: strict"] {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          transform: translate3d(0, 0, 0);
          will-change: scroll-position;
        }
        
        /* Optimize transitions */
        .transition-colors,
        .transition-all {
          will-change: auto;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
      `}</style>
    </div>
  );
};

// Export without memo - let React handle re-renders naturally
// The component is already optimized internally
export const ArtifactRenderer = ArtifactRendererComponent;
