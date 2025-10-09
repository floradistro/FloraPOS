'use client';

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { SimpleArtifactRenderer, ArtifactLanguage } from './SimpleArtifactRenderer';

export interface AICanvasRef {
  setArtifact: (code: string, language: ArtifactLanguage, title?: string, isStreaming?: boolean) => void;
  clearArtifact: () => void;
  getCurrentArtifact: () => { code: string; language: ArtifactLanguage; title: string; id: string } | null;
}

interface Artifact {
  id: string;
  code: string;
  language: ArtifactLanguage;
  title: string;
  isStreaming: boolean;
}

export const SimpleAICanvas = forwardRef<AICanvasRef, {}>((props, ref) => {
  const [artifact, setArtifactState] = useState<Artifact | null>(null);

  useImperativeHandle(ref, () => ({
    setArtifact: (code: string, language: ArtifactLanguage, title?: string, isStreaming = false) => {
      if (!code || !language) {
        console.warn('⚠️ [SimpleAICanvas] Invalid artifact params');
        return;
      }

      setArtifactState(prev => {
        // If updating existing artifact of same language, keep the ID
        if (prev && prev.language === language) {
          return {
            ...prev,
            code,
            title: title || prev.title,
            isStreaming
          };
        }
        
        // Otherwise create new artifact
        return {
          id: `artifact-${Date.now()}`,
          code,
          language,
          title: title || `${language.toUpperCase()} Artifact`,
          isStreaming
        };
      });
    },
    
    clearArtifact: () => {
      setArtifactState(null);
    },
    
    getCurrentArtifact: () => {
      if (!artifact) return null;
      return {
        id: artifact.id,
        code: artifact.code,
        language: artifact.language,
        title: artifact.title
      };
    }
  }), [artifact]);

  if (!artifact) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <p className="text-sm" style={{ fontFamily: 'Tiempo, serif' }}>
          Artifacts will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 bg-neutral-950">
      <SimpleArtifactRenderer
        code={artifact.code}
        language={artifact.language}
        title={artifact.title}
        isStreaming={artifact.isStreaming}
      />
    </div>
  );
});

SimpleAICanvas.displayName = 'SimpleAICanvas';


