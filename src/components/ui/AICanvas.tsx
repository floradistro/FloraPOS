'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ArtifactRenderer, ArtifactLanguage } from './ArtifactRenderer';

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

export const AICanvas = forwardRef<AICanvasRef, {}>((props, ref) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Only log on state changes, not every render
  useEffect(() => {
    console.log('🎨 [AICanvas] State update - artifacts:', artifacts.length, 'activeId:', activeId);
  }, [artifacts.length, activeId]);

  // Auto-save active artifact to temporary storage
  useEffect(() => {
    const activeArtifact = artifacts.find(a => a.id === activeId);
    
    if (activeArtifact && !activeArtifact.isStreaming) {
      // Save to temporary storage after streaming completes
      const saveTemp = async () => {
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
            console.log('💾 [AICanvas] Auto-saved to temporary storage:', activeArtifact.id);
            // Mark as temp saved
            setArtifacts(prev => prev.map(a => 
              a.id === activeArtifact.id ? { ...a, tempSaved: true } : a
            ));
          }
        } catch (error) {
          console.error('Failed to save temporary artifact:', error);
        }
      };
      
      saveTemp();
    }
  }, [activeId, artifacts]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setArtifact: (code: string, language: ArtifactLanguage, title?: string, isStreaming = false) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 [AICanvas.setArtifact] CALLED!');
      console.log('🎨 [AICanvas] Params:', { language, codeLength: code.length, title, isStreaming });
      console.log('🎨 [AICanvas] Code preview:', code.substring(0, 100));
      
      if (!code || !language) {
        console.error('❌ [AICanvas] Invalid artifact:', { hasCode: !!code, language });
        return;
      }

      let newArtifactId: string | null = null;

      // Check if we should UPDATE the active artifact instead of creating new
      setArtifacts(prev => {
        const currentActive = prev.find(a => a.id === activeId);
        
        if (currentActive && currentActive.language === language) {
          // UPDATE existing artifact (iterative editing!)
          console.log('🔄 [AICanvas] UPDATING existing artifact:', currentActive.id);
          console.log('🔄 [AICanvas] Old code length:', currentActive.code.length);
          console.log('🔄 [AICanvas] New code length:', code.length);
          
          return prev.map(artifact => 
            artifact.id === activeId
              ? { 
                  ...artifact, 
                  code, 
                  title: title || artifact.title,
                  isStreaming,
                  isEditing: true  // Mark as editing existing artifact
                }
              : artifact
          );
        } else {
          // CREATE new artifact
          console.log('➕ [AICanvas] CREATING new artifact');
          
          const newArtifact: Artifact = {
            id: `artifact-${Date.now()}`,
            code,
            language,
            title: title || `${language.toUpperCase()} Artifact`,
            isStreaming,
            isEditing: false  // New artifact, not editing
          };
          
          // Store ID to set as active after state update
          newArtifactId = newArtifact.id;
          
          console.log('✅ [AICanvas] New artifact created:', newArtifact.id);
          return [...prev, newArtifact];
        }
      });

      // Set the new artifact as active (after state update)
      if (newArtifactId) {
        setActiveId(newArtifactId);
      }
      
      console.log('✅✅✅ [AICanvas] Artifact operation complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
    
    clearArtifact: () => {
      console.log('🗑️ [AICanvas] Clearing artifacts');
      setArtifacts([]);
      setActiveId(null);
    },
    
    getCurrentArtifact: () => {
      const current = artifacts.find(a => a.id === activeId);
      if (current) {
        console.log('📋 [AICanvas] Getting current artifact:', {
          id: current.id,
          language: current.language,
          codeLength: current.code.length,
          title: current.title,
          tempSaved: current.tempSaved
        });
        return {
          id: current.id,
          code: current.code,
          language: current.language,
          title: current.title
        };
      }
      console.log('📋 [AICanvas] No active artifact');
      return null;
    },
  }), [activeId, artifacts]);

  const activeArtifact = artifacts.find(a => a.id === activeId);

  const removeArtifact = (id: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (activeId === id) {
      const remaining = artifacts.filter(a => a.id !== id);
      setActiveId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-neutral-950" style={{ overflow: 'hidden', contain: 'layout size style' }}>
      {/* Tabs */}
      {artifacts.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-neutral-900 border-b border-neutral-800 overflow-x-auto">
          {artifacts.map(artifact => (
            <div
              key={artifact.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition cursor-pointer ${
                activeId === artifact.id
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <div 
                onClick={() => setActiveId(artifact.id)}
                className="flex items-center gap-2 flex-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="text-xs font-medium truncate max-w-[100px]">
                  {artifact.title}
                </span>
                {artifact.tempSaved && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-mono" title="Temporary - not saved permanently">
                    TEMP
                  </span>
                )}
              </div>
              {artifacts.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeArtifact(artifact.id);
                  }}
                  className="p-0.5 rounded hover:bg-neutral-700 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Remove artifact"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4" style={{ minHeight: 0, minWidth: 0 }}>
        {activeArtifact ? (
          <ArtifactRenderer
            key={activeArtifact.id}
            code={activeArtifact.code}
            language={activeArtifact.language}
            title={activeArtifact.title}
            isStreaming={activeArtifact.isStreaming}
            isEditing={activeArtifact.isEditing}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg className="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});

AICanvas.displayName = 'AICanvas';
