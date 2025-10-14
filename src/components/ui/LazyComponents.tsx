'use client';

/**
 * Lazy Loaded Components
 * Heavy dependencies loaded only when needed
 * Reduces initial bundle size by ~7MB
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-400 border-t-transparent"></div>
  </div>
);

// Three.js Components (5.9MB) - Lazy loaded
export const ThreeBackground = dynamic(
  () => import('./ThreeBackground'),
  {
    ssr: false,
    loading: () => null
  }
);

export const MagicBackground = dynamic(
  () => import('./MagicBackground'),
  {
    ssr: false,
    loading: () => null
  }
);

export const StoreLayoutCanvas = dynamic(
  () => import('./StoreLayoutCanvas'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// Scandit Scanner (1.1MB) - Lazy loaded
export const ScanditIDScanner = dynamic(
  () => import('./ScanditIDScanner'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// PDF/Print Components (0.5MB) - Lazy loaded
export const PrintView = dynamic(
  () => import('./PrintView'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// AI Components (can be lazy loaded)
export const OptimizedAICanvas = dynamic(
  () => import('./OptimizedAICanvas'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

export const ArtifactRenderer = dynamic(
  () => import('./OptimizedArtifactRenderer'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// Menu Display (only needed for menu view)
export const SharedMenuDisplay = dynamic(
  () => import('./SharedMenuDisplay'),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

// Virtualized Product Grid (uses react-window)
export const VirtualizedProductGrid = dynamic(
  () => import('./VirtualizedProductGrid').then(m => ({ default: m.VirtualizedProductGrid })),
  {
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

