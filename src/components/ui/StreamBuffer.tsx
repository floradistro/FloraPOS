'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * High-performance stream buffer using RAF (60fps)
 * Accumulates chunks and renders at optimal frame rate
 */

interface StreamBufferOptions {
  onUpdate: (content: string) => void;
  onComplete?: () => void;
  batchSize?: number;
}

export function useStreamBuffer({ onUpdate, onComplete, batchSize = 10 }: StreamBufferOptions) {
  const bufferRef = useRef<string[]>([]);
  const accumulatedRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);
  const lastFlushTimeRef = useRef<number>(0);
  const isFlushingRef = useRef<boolean>(false);

  // Flush buffer at 60fps using RAF
  const flushBuffer = useCallback(() => {
    if (isFlushingRef.current) return;
    
    isFlushingRef.current = true;
    
    const flush = () => {
      const now = performance.now();
      
      // 60fps = 16.67ms per frame
      if (now - lastFlushTimeRef.current >= 16.67) {
        if (bufferRef.current.length > 0) {
          // Batch process chunks
          const chunks = bufferRef.current.splice(0, batchSize);
          const newContent = chunks.join('');
          accumulatedRef.current += newContent;
          
          onUpdate(accumulatedRef.current);
          lastFlushTimeRef.current = now;
        }
      }
      
      // Continue flushing if buffer has content
      if (bufferRef.current.length > 0) {
        rafIdRef.current = requestAnimationFrame(flush);
      } else {
        isFlushingRef.current = false;
        rafIdRef.current = null;
      }
    };
    
    rafIdRef.current = requestAnimationFrame(flush);
  }, [onUpdate, batchSize]);

  // Add chunk to buffer
  const addChunk = useCallback((chunk: string) => {
    bufferRef.current.push(chunk);
    
    // Start flushing if not already running
    if (!rafIdRef.current) {
      flushBuffer();
    }
  }, [flushBuffer]);

  // Force immediate flush
  const flush = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (bufferRef.current.length > 0) {
      const allChunks = bufferRef.current.splice(0);
      accumulatedRef.current += allChunks.join('');
      onUpdate(accumulatedRef.current);
    }
    
    isFlushingRef.current = false;
    
    if (onComplete) {
      onComplete();
    }
  }, [onUpdate, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Reset buffer
  const reset = useCallback(() => {
    bufferRef.current = [];
    accumulatedRef.current = '';
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isFlushingRef.current = false;
  }, []);

  return { addChunk, flush, reset, accumulated: accumulatedRef.current };
}

