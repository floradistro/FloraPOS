'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SaveArtifactButton } from '../ai/SaveArtifactButton';

export type ArtifactLanguage = 'html' | 'react' | 'jsx' | 'javascript' | 'typescript' | 'css' | 'svg' | 'mermaid' | 'threejs';

export interface SimpleArtifactProps {
  code: string;
  language: ArtifactLanguage;
  title?: string;
  conversationId?: number;
  messageId?: number;
  isStreaming?: boolean;
}

export function SimpleArtifactRenderer({ 
  code, 
  language, 
  title = 'Code Artifact',
  conversationId,
  messageId,
  isStreaming = false
}: SimpleArtifactProps) {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  // Force code view during streaming to prevent glitching
  useEffect(() => {
    if (isStreaming && view === 'preview') {
      setView('code');
    }
  }, [isStreaming]);

  // Auto-switch to preview when streaming completes
  useEffect(() => {
    if (!isStreaming && code && view === 'code') {
      const timer = setTimeout(() => setView('preview'), 500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, code]);

  // Auto-scroll code view to bottom during streaming
  useEffect(() => {
    if (isStreaming && view === 'code' && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [code, isStreaming, view]);

  const generateHTML = () => {
    if (language === 'html') {
      return code;
    }
    
    if (language === 'threejs' || (language === 'javascript' && (code.includes('THREE') || code.includes('Scene()')))) {
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
    
    ${code}
  </script>
</body>
</html>`;
    }
    
    if (language === 'react' || language === 'jsx' || language === 'typescript') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    ${code}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(typeof App !== 'undefined' ? App : (() => React.createElement('div', {}, 'Component not found'))));
  </script>
</body>
</html>`;
    }
    
    if (language === 'javascript') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>${code}</script>
</body>
</html>`;
    }
    
    return `<!DOCTYPE html><html><body><pre>${code}</pre></body></html>`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="h-full w-full flex flex-col bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
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
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Streaming...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex gap-1 bg-neutral-700 rounded p-1">
            <button
              onClick={() => setView('code')}
              className={`px-3 py-1 text-xs rounded transition ${
                view === 'code' ? 'bg-neutral-600 text-white' : 'text-neutral-400'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => !isStreaming && setView('preview')}
              disabled={isStreaming}
              className={`px-3 py-1 text-xs rounded transition ${
                view === 'preview' ? 'bg-neutral-600 text-white' : 'text-neutral-400'
              } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isStreaming ? 'Preview disabled while streaming' : 'Show preview'}
            >
              Preview
            </button>
          </div>

          {/* Actions */}
          {view === 'preview' && (
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition"
            title="Copy"
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

          {/* Save to Library Button - Always Visible */}
          {!isStreaming && (
            <SaveArtifactButton
              code={code}
              language={language}
              artifactType={language}
              title={title}
              conversationId={conversationId}
              messageId={messageId}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative">
        {view === 'code' ? (
          <div 
            ref={codeRef}
            className="absolute inset-0 overflow-auto"
          >
            <pre className="text-[13px] leading-[1.6] text-neutral-200 font-mono p-4 m-0">
{code}{isStreaming && <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse" />}
            </pre>
          </div>
        ) : (
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={generateHTML()}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-modals allow-same-origin"
            title="Preview"
          />
        )}
      </div>
    </div>
  );
}


