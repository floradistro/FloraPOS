'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SaveArtifactButton } from '../ai/SaveArtifactButton';

interface CodeArtifactProps {
  code: string;
  language: 'react' | 'html' | 'javascript' | 'css' | 'typescript' | 'threejs' | 'svg' | 'mermaid';
  title?: string;
  onClose?: () => void;
  conversationId?: number;
  messageId?: number;
  isStreaming?: boolean;
}

const CodeArtifactComponent: React.FC<CodeArtifactProps> = ({
  code,
  language,
  title = 'Code Artifact',
  onClose,
  conversationId,
  messageId,
  isStreaming = false
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [htmlContent, setHtmlContent] = useState<string>('<!DOCTYPE html><html><body><div style="display:flex;align-items:center;justify-content:center;height:100vh;color:white;background:#0a0a0a;">Loading...</div></body></html>');

  // Force code view during streaming to prevent glitching
  useEffect(() => {
    if (isStreaming && activeTab === 'preview') {
      setActiveTab('code');
    }
  }, [isStreaming]);

  useEffect(() => {
    if (activeTab === 'preview') {
      generateHtmlContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, activeTab, language]);

  const generateHtmlContent = () => {
    
    try {
      setError(null);
      let content = '';

      if (language === 'html') {
        // Pure HTML
        content = code;
      } else if (language === 'threejs') {
        // Three.js - Modern ES Module approach with importmap
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #0a0a0a;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100vh;
      touch-action: none;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      color: white;
      font-size: 11px;
      background: rgba(0,0,0,0.7);
      padding: 6px 10px;
      border-radius: 4px;
      font-family: monospace;
      pointer-events: none;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    #error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff4444;
      font-size: 13px;
      background: rgba(0,0,0,0.9);
      padding: 20px 24px;
      border-radius: 8px;
      border: 1px solid rgba(255,68,68,0.3);
      max-width: 80%;
      text-align: left;
      display: none;
      z-index: 1000;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Courier New', monospace;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      font-size: 13px;
      background: rgba(0,0,0,0.9);
      padding: 16px 20px;
      border-radius: 8px;
      text-align: center;
      z-index: 999;
      backdrop-filter: blur(10px);
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="info">Three.js Scene • Loading...</div>
  <div id="loading">
    <div class="spinner"></div>
    <div>Loading Three.js...</div>
  </div>
  <div id="error"></div>
  
  <!-- Import Map for ES Modules -->
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  
  <!-- Main Script -->
  <script type="module">
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const infoEl = document.getElementById('info');
    
    try {
      // Import Three.js and common addons
      const THREE = await import('three');
      window.THREE = THREE;
      
      // Import OrbitControls
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      window.OrbitControls = OrbitControls;
      
      
      // Hide loading, update info
      if (loadingEl) loadingEl.style.display = 'none';
      if (infoEl) infoEl.textContent = 'Three.js Scene • Ready';
      
      // Execute user code
      try {
        // Wrap user code in async function to support await
        const userCode = async () => {
          ${code}
        };
        await userCode();
        
        if (infoEl) infoEl.textContent = 'Three.js Scene • Running';
      } catch (err) {
        console.error('❌ User code error:', err);
        if (errorEl) {
          errorEl.innerHTML = '<strong>Error in your code:</strong>\\n\\n' + err.message + '\\n\\n' + (err.stack || '');
          errorEl.style.display = 'block';
        }
        if (infoEl) infoEl.textContent = 'Three.js Scene • Error';
      }
      
    } catch (err) {
      console.error('❌ Failed to load Three.js:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.innerHTML = '<strong>Failed to load Three.js:</strong>\\n\\n' + err.message;
        errorEl.style.display = 'block';
      }
      if (infoEl) infoEl.textContent = 'Three.js Scene • Load Failed';
    }
    
    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('❌ Global error:', e);
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.innerHTML = '<strong>Runtime Error:</strong>\\n\\n' + (e.message || e.error?.message || 'Unknown error');
        errorEl.style.display = 'block';
      }
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      console.error('❌ Unhandled promise rejection:', e);
      if (errorEl) {
        errorEl.innerHTML = '<strong>Promise Error:</strong>\\n\\n' + (e.reason?.message || e.reason || 'Unknown error');
        errorEl.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
      } else if (language === 'react' || language === 'typescript') {
        // React/TypeScript - render as React component
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #0a0a0a;
      color: white;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    ${code}
    
    // Render the component
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      
      // Try to find and render the main component
      const componentNames = Object.keys(window).filter(key => 
        typeof window[key] === 'function' && 
        key[0] === key[0].toUpperCase() &&
        !['React', 'ReactDOM'].includes(key)
      );
      
      if (componentNames.length > 0) {
        const Component = window[componentNames[0]];
        root.render(React.createElement(Component));
      } else {
        // Try to render App component by default
        if (typeof App !== 'undefined') {
          root.render(React.createElement(App));
        } else {
          root.render(React.createElement('div', {}, 'No component found to render'));
        }
      }
    }
  </script>
</body>
</html>`;
      } else if (language === 'javascript') {
        // Pure JavaScript
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: #0a0a0a;
      color: white;
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
      } else if (language === 'css') {
        // CSS with preview elements
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${code}
  </style>
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>This is a sample paragraph.</p>
    <button>Sample Button</button>
    <div class="box">Sample Box</div>
  </div>
</body>
</html>`;
      }

      setHtmlContent(content);
    } catch (err: any) {
      setError(err.message || 'Error rendering code');
      console.error('❌ [CodeArtifact] Rendering error:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${language === 'typescript' ? 'tsx' : language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border border-neutral-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-neutral-900/40 border-b border-neutral-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
              {title}
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-neutral-800/60 text-neutral-400 text-xs rounded-md font-mono">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-neutral-800/40 rounded-lg p-1">
            <button
              onClick={() => !isStreaming && setActiveTab('preview')}
              disabled={isStreaming}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white'
              } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ fontFamily: 'Tiempo, serif' }}
              title={isStreaming ? 'Preview disabled while streaming' : 'Show preview'}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                activeTab === 'code'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Tiempo, serif' }}
            >
              Code
            </button>
          </div>

          {/* Actions */}
          <SaveArtifactButton
            code={code}
            artifactType={language}
            language={language}
            title={title}
            conversationId={conversationId}
            messageId={messageId}
          />

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-all"
            title="Refresh preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={copyToClipboard}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-all"
            title="Copy code"
          >
            {copySuccess ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          <button
            onClick={downloadCode}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-all"
            title="Download code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-all"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="w-full h-full relative">
            {error ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-400 text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
                    {error}
                  </p>
                </div>
              </div>
            ) : (
              <iframe
                key={refreshKey}
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-0 bg-[#0a0a0a]"
                sandbox="allow-scripts allow-modals"
                title="Code Preview"
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full overflow-auto p-4 bg-[#0f0f0f]">
            <pre className="text-sm text-neutral-300 font-mono leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Export without memo - let React handle re-renders naturally
export const CodeArtifact = CodeArtifactComponent;
