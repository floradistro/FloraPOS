/**
 * TV Preview Component
 * Shows live preview of what's displaying on the TV
 */

'use client'

import React, { useState, useEffect } from 'react'

interface TVPreviewProps {
  tvId: string
  tvNumber: number
  locationId: number
  isOnline: boolean
  isPushing?: boolean
}

export function TVPreview({ tvId, tvNumber, locationId, isOnline, isPushing = false }: TVPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    // Build the TV display URL
    const url = new URL('/menu-display', window.location.origin)
    url.searchParams.set('location_id', locationId.toString())
    url.searchParams.set('tv_number', tvNumber.toString())
    setPreviewUrl(url.toString())
  }, [locationId, tvNumber])

  // Reload iframe when pushing config
  useEffect(() => {
    if (isPushing && isExpanded) {
      setIsLoading(true)
      // Force iframe reload
      const iframe = document.getElementById(`tv-preview-${tvId}`) as HTMLIFrameElement
      if (iframe) {
        iframe.src = iframe.src
      }
    }
  }, [isPushing, isExpanded, tvId])

  if (!isOnline) return null

  return (
    <div className="mt-2 pt-2 border-t border-white/10">
      {/* Preview Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded text-xs transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{isExpanded ? 'Hide' : 'Show'} Live Preview</span>
        </div>
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Preview Container */}
      {isExpanded && (
        <div className="mt-2 relative">
          {/* Pushing Animation Overlay */}
          {isPushing && (
            <div className="absolute inset-0 z-10 bg-blue-500/20 border-2 border-blue-500 rounded-lg animate-pulse flex items-center justify-center">
              <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Pushing Config...
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && !isPushing && (
            <div className="absolute inset-0 z-10 bg-neutral-900/80 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Loading preview...
              </div>
            </div>
          )}

          {/* Live Preview Iframe */}
          <div className="relative bg-neutral-900 rounded-lg overflow-hidden border border-white/20" style={{ aspectRatio: '16/9' }}>
            <iframe
              id={`tv-preview-${tvId}`}
              src={previewUrl}
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
              title={`TV ${tvNumber} Preview`}
              style={{ 
                border: 'none',
                pointerEvents: 'none' // Disable interaction
              }}
            />
          </div>

          {/* Preview Info */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/40 px-1">
            <span>Live Preview • Updates in real-time</span>
            <button
              onClick={() => {
                const iframe = document.getElementById(`tv-preview-${tvId}`) as HTMLIFrameElement
                if (iframe) {
                  setIsLoading(true)
                  iframe.src = iframe.src
                }
              }}
              className="text-white/40 hover:text-white/80 transition-colors"
              title="Refresh preview"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact TV Preview Card
 * Shows a small thumbnail of the TV display
 */
export function TVPreviewCard({ 
  tvId, 
  tvNumber, 
  locationId, 
  isOnline,
  onClick 
}: TVPreviewProps & { onClick?: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    const url = new URL('/menu-display', window.location.origin)
    url.searchParams.set('location_id', locationId.toString())
    url.searchParams.set('tv_number', tvNumber.toString())
    setPreviewUrl(url.toString())
  }, [locationId, tvNumber])

  if (!isOnline) return null

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
        <iframe
          src={previewUrl}
          className="w-full h-full"
          title={`TV ${tvNumber} Thumbnail`}
          style={{ 
            border: 'none',
            pointerEvents: 'none',
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            width: '200%',
            height: '200%'
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
        <span className="text-[10px] text-white/90 font-medium">Click to expand</span>
      </div>
    </div>
  )
}

