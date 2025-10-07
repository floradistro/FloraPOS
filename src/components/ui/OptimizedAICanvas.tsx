'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { OptimizedArtifactRenderer, ArtifactLanguage } from './OptimizedArtifactRenderer';

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
  isStreaming?: boolean;
  isEditing?: boolean;
  tempSaved?: boolean;
}

export const OptimizedAICanvas = forwardRef<AICanvasRef, {}>((props, ref) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-save to temporary storage (debounced)
  useEffect(() => {
    const activeArtifact = artifacts.find(a => a.id === activeId);
    
    if (activeArtifact && !activeArtifact.isStreaming && !activeArtifact.tempSaved) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch('/api/artifacts/temp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeArtifact.id,
              code: activeArtifact.code,
              language: activeArtifact.language,
              title: activeArtifact.title
            })
          });
          
          if (response.ok) {
            setArtifacts(prev => prev.map(a => 
              a.id === activeArtifact.id ? { ...a, tempSaved: true } : a
            ));
          }
        } catch (error) {
          console.error('Failed to save temporary artifact:', error);
        }
      }, 500); // Debounce 500ms
      
      return () => clearTimeout(timer);
    }
  }, [activeId, artifacts]);

  // Define methods at component level (not inside useImperativeHandle)
  const setArtifact = useCallback((code: string, language: ArtifactLanguage, title?: string, isStreaming = false) => {
    if (!code || !language) {
      console.warn('⚠️ [OptimizedAICanvas] setArtifact called with invalid code or language');
      return;
    }

    console.log('🎨 [OptimizedAICanvas.setArtifact] Called with:', { language, title, codeLength: code.length, isStreaming });

    // Generate new ID upfront so we can set it synchronously
    const newId = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setArtifacts(prev => {
      const currentActive = prev.find(a => a.id === activeId);
      
      // UPDATE existing artifact (same language)
      if (currentActive && currentActive.language === language) {
        console.log('📝 [OptimizedAICanvas] Updating existing artifact:', currentActive.id);
        return prev.map(artifact => 
          artifact.id === activeId
            ? { 
                ...artifact, 
                code, 
                title: title || artifact.title,
                isStreaming,
                isEditing: true,
                tempSaved: false
              }
            : artifact
        );
      }
      
      // CREATE new artifact
      const newArtifact: Artifact = {
        id: newId,
        code,
        language,
        title: title || `${language.toUpperCase()} Artifact`,
        isStreaming,
        isEditing: false,
        tempSaved: false
      };
      
      
      return [...prev, newArtifact];
    });
    
    // Set active ID synchronously for new artifacts
    setActiveId(newId);
    console.log('🎯 [OptimizedAICanvas] Set active ID to:', newId);
  }, [activeId]);

  const clearArtifact = useCallback(() => {
    setArtifacts([]);
    setActiveId(null);
  }, []);

  const getCurrentArtifact = useCallback(() => {
    const current = artifacts.find(a => a.id === activeId);
    return current ? {
      code: current.code,
      language: current.language,
      title: current.title,
      id: current.id
    } : null;
  }, [artifacts, activeId]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setArtifact,
    clearArtifact,
    getCurrentArtifact
  }), [setArtifact, clearArtifact, getCurrentArtifact]);

  const activeArtifact = artifacts.find(a => a.id === activeId);

  if (!activeArtifact) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-sm">Artifacts will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <OptimizedArtifactRenderer
        key={activeArtifact.id}
        code={activeArtifact.code}
        language={activeArtifact.language}
        title={activeArtifact.title}
        isStreaming={activeArtifact.isStreaming}
        isEditing={activeArtifact.isEditing}
      />
    </div>
  );
});

OptimizedAICanvas.displayName = 'OptimizedAICanvas';

