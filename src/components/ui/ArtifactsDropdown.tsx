'use client';

import React, { useState, useEffect } from 'react';
import { AICanvasRef } from './SimpleAICanvas';
import { ArtifactLanguage } from './SimpleArtifactRenderer';
import { apiFetch } from '@/lib/api-fetch';

interface Artifact {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  artifact_type: string;
  language: string;
  code_content: string;
  status: 'draft' | 'published';
  conversation_id?: number;
  message_id?: number;
  published_url?: string;
  created_at: string;
  updated_at: string;
}

interface ArtifactsDropdownProps {
  canvasRef?: React.RefObject<AICanvasRef>;
  onViewChange?: (view: 'ai-view') => void;
}

export function ArtifactsDropdown({ canvasRef, onViewChange }: ArtifactsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch artifacts when dropdown opens
  useEffect(() => {
    if (isOpen && artifacts.length === 0) {
      fetchArtifacts();
    }
  }, [isOpen]);

  const fetchArtifacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use apiFetch to automatically add environment header (Docker vs Production)
      const response = await apiFetch('/api/proxy/flora-im/artifacts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch artifacts');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.artifacts)) {
        setArtifacts(data.artifacts);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch artifacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load artifacts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadArtifact = (artifact: Artifact) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Artifact details:', {
      id: artifact.id,
      type: artifact.artifact_type,
      language: artifact.language,
      codeLength: artifact.code_content.length,
      hasCanvasRef: !!canvasRef,
      hasOnViewChange: !!onViewChange
    });
    
    // Close dropdown first
    setIsOpen(false);
    
    // Switch to AI view if not already there
    console.log('🔄 [ArtifactsDropdown] Switching to AI view...');
    onViewChange?.('ai-view');
    
    // Load artifact into canvas with retry logic
    // We need to wait for React to mount the AICanvas after view change
    const attemptLoad = (retries = 0, maxRetries = 20) => {
      // Use requestAnimationFrame to wait for React to finish rendering
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (canvasRef?.current) {
            try {
              canvasRef.current.setArtifact(
                artifact.code_content,
                artifact.language as ArtifactLanguage,
                artifact.title,
                false // Not streaming
              );
            } catch (error) {
              console.error('❌ [ArtifactsDropdown] Error loading artifact:', error);
            }
          } else if (retries < maxRetries) {
            attemptLoad(retries + 1, maxRetries);
          } else {
            console.error('❌ [ArtifactsDropdown] Failed to load artifact - canvas ref never became available');
            console.error('💡 Make sure you are switching to AI view and the AICanvas component is mounting');
          }
        }, retries === 0 ? 50 : 100); // First try sooner, then regular intervals
      });
    };
    
    attemptLoad();
  };

  const getArtifactIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'react':
      case 'jsx':
      case 'tsx':
        return '⚛️';
      case 'html':
        return '🌐';
      case 'javascript':
      case 'js':
        return '📜';
      case 'typescript':
      case 'ts':
        return '📘';
      case 'threejs':
      case '3d':
        return '🎮';
      case 'css':
        return '🎨';
      case 'svg':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 h-[30px] rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-2 whitespace-nowrap border bg-transparent text-neutral-400 border-neutral-500/30 hover:bg-neutral-600/10 hover:border-neutral-400/50"
        style={{ fontFamily: 'Tiempo, serif' }}
        title="Artifacts Library"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span>Artifacts</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-96 max-h-[500px] bg-neutral-900/95 backdrop-blur-md border border-neutral-700/50 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-700/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Tiempo, serif' }}>
                Artifacts Library
              </h3>
              <button
                onClick={fetchArtifacts}
                disabled={isLoading}
                className="p-1 rounded hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <svg className={`w-4 h-4 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && artifacts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-neutral-500 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                      Loading artifacts...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 px-4">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-red-400 mb-2" style={{ fontFamily: 'Tiempo, serif' }}>
                      {error}
                    </p>
                    <button
                      onClick={fetchArtifacts}
                      className="text-xs text-neutral-400 hover:text-white transition-colors"
                      style={{ fontFamily: 'Tiempo, serif' }}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : artifacts.length === 0 ? (
                <div className="flex items-center justify-center py-12 px-4">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-neutral-400 mb-1" style={{ fontFamily: 'Tiempo, serif' }}>
                      No artifacts saved yet
                    </p>
                    <p className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                      Create code artifacts in AI chat to save them here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/50">
                  {artifacts.map((artifact) => (
                    <button
                      key={artifact.id}
                      onClick={() => loadArtifact(artifact)}
                      className="w-full px-4 py-3 hover:bg-neutral-800/40 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0 mt-0.5">
                          {getArtifactIcon(artifact.artifact_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'Tiempo, serif' }}>
                              {artifact.title}
                            </h4>
                            <span className="text-[10px] text-neutral-500 whitespace-nowrap flex-shrink-0" style={{ fontFamily: 'Tiempo, serif' }}>
                              {formatDate(artifact.created_at)}
                            </span>
                          </div>
                          {artifact.description && (
                            <p className="text-xs text-neutral-400 mb-1.5 line-clamp-1" style={{ fontFamily: 'Tiempo, serif' }}>
                              {artifact.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800/60 text-neutral-400 rounded font-mono">
                              {artifact.language}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              artifact.status === 'published' 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-neutral-800/60 text-neutral-400'
                            }`} style={{ fontFamily: 'Tiempo, serif' }}>
                              {artifact.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {artifacts.length > 0 && (
              <div className="px-4 py-2.5 border-t border-neutral-700/50 text-center">
                <p className="text-[10px] text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                  {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

