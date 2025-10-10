/**
 * Store Layout Canvas
 * Visual builder for physical TV layout in store
 * Drag and position TVs on a dot grid canvas
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { Database } from '@/types/supabase'

type TVDevice = Database['public']['Tables']['tv_devices']['Row']

// Helper component for TV preview iframe
function TVPreviewIframe({ tvId, tvNumber, locationId }: { tvId: string; tvNumber: number; locationId: number }) {
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    const fetchTVUrl = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        
        const { data: tvDevice } = await supabase
          .from('tv_devices')
          .select('metadata')
          .eq('id', tvId)
          .single()
        
        if (tvDevice?.metadata && typeof tvDevice.metadata === 'object' && 'current_url' in tvDevice.metadata) {
          const currentUrl = (tvDevice.metadata as { current_url?: string }).current_url
          if (currentUrl) {
            setPreviewUrl(currentUrl)
            return
          }
        }
      } catch (error) {
        console.log('Could not fetch TV metadata, using fallback URL')
      }
      
      // Fallback
      const url = new URL('/menu-display', window.location.origin)
      url.searchParams.set('location_id', locationId.toString())
      url.searchParams.set('tv_number', tvNumber.toString())
      setPreviewUrl(url.toString())
    }
    
    fetchTVUrl()
  }, [tvId, locationId, tvNumber])

  if (!previewUrl) return <div className="absolute inset-0 bg-neutral-900 rounded-lg flex items-center justify-center text-white/50 text-xs">Loading...</div>

  return (
    <div className="absolute inset-0 bg-neutral-900 rounded-lg overflow-hidden">
      <iframe
        src={previewUrl}
        className="w-full h-full"
        title={`TV ${tvNumber} Preview`}
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
  )
}

interface TVPosition {
  tvId: string
  x: number
  y: number
  width: number
  height: number
  orientation: 'horizontal' | 'vertical'
}

interface StoreLayoutCanvasProps {
  tvDevices: TVDevice[]
  isOnline: (tv: TVDevice) => boolean
  locationId: number
}

export function StoreLayoutCanvas({ tvDevices, isOnline, locationId }: StoreLayoutCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Map<string, TVPosition>>(new Map())
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  // Initialize TV positions (default layout)
  useEffect(() => {
    const newPositions = new Map<string, TVPosition>()
    tvDevices.forEach((tv, index) => {
      if (!positions.has(tv.id)) {
        newPositions.set(tv.id, {
          tvId: tv.id,
          x: 100 + (index % 3) * 420, // 3 columns
          y: 100 + Math.floor(index / 3) * 280,
          width: 400,
          height: 225, // 16:9 aspect ratio
          orientation: 'horizontal'
        })
      } else {
        newPositions.set(tv.id, positions.get(tv.id)!)
      }
    })
    setPositions(newPositions)
  }, [tvDevices])

  const handleMouseDown = (tvId: string, e: React.MouseEvent) => {
    const pos = positions.get(tvId)
    if (!pos) return

    setDragging(tvId)
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return

    const pos = positions.get(dragging)
    if (!pos) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    setPositions(prev => {
      const updated = new Map(prev)
      updated.set(dragging, { ...pos, x: newX, y: newY })
      return updated
    })
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.25, Math.min(2, prev + delta)))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent w-full h-full pr-4 rounded-2xl">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900/20 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-lg" style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.03)' }}>
          <h2 className="text-sm font-medium text-white/90" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Store Layout Builder</h2>
          <div className="w-px h-4 bg-white/[0.08]" />
          <span className="text-xs text-white/50 font-medium">
            {tvDevices.length} TVs • {tvDevices.filter(isOnline).length} Online
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 bg-neutral-900/20 backdrop-blur-md border border-white/[0.06] rounded-2xl px-2 py-1.5 shadow-lg" style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.03)' }}>
          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom(-0.1)}
            className="px-2 h-[26px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.16] text-white/70 hover:text-white/90 rounded-full text-xs transition-all duration-300 ease-out hover:scale-[1.05] active:scale-95 flex items-center justify-center"
            style={{ boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)' }}
            title="Zoom out"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-white/60 w-10 text-center font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => handleZoom(0.1)}
            className="px-2 h-[26px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.16] text-white/70 hover:text-white/90 rounded-full text-xs transition-all duration-300 ease-out hover:scale-[1.05] active:scale-95 flex items-center justify-center"
            style={{ boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)' }}
            title="Zoom in"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <div className="w-px h-5 bg-white/[0.08]" />
          
          <button
            onClick={() => setScale(1)}
            className="px-3 h-[26px] bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] hover:border-white/[0.24] text-white/90 hover:text-white rounded-full text-xs font-medium transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            style={{ 
              boxShadow: '0 2px 12px rgba(255, 255, 255, 0.04)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-auto relative ml-2 my-2 mr-6 min-h-0 rounded-xl"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          cursor: dragging ? 'grabbing' : 'default'
        }}
      >
        <div 
          className="relative w-full h-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            minWidth: '1600px',
            minHeight: '1200px'
          }}
        >
          {/* TV Elements */}
          {Array.from(positions.entries()).map(([tvId, pos]) => {
            const tv = tvDevices.find(t => t.id === tvId)
            if (!tv) return null
            const online = isOnline(tv)

            return (
              <div
                key={tvId}
                className={`absolute group ${dragging === tvId ? 'z-50' : 'z-10'}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${pos.width}px`,
                  height: `${pos.height}px`,
                  cursor: dragging === tvId ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleMouseDown(tvId, e)}
              >
                {/* TV Container */}
                <div className={`relative w-full h-full rounded-lg border-2 transition-all ${
                  dragging === tvId 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/50'
                    : online 
                      ? 'border-white/20 hover:border-white/40 shadow-xl' 
                      : 'border-white/10 opacity-50'
                }`}>
                  {/* TV Preview */}
                  <TVPreviewIframe tvId={tv.id} tvNumber={tv.tv_number} locationId={locationId} />

                  {/* TV Label */}
                  <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-neutral-900/90 backdrop-blur-sm border border-white/20 rounded text-xs font-bold text-white shadow-lg flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-white/20'}`} />
                    TV {tv.tv_number}
                  </div>

                  {/* TV Name */}
                  <div className="absolute bottom-2 left-2 right-2 z-20 px-2 py-1 bg-neutral-900/90 backdrop-blur-sm border border-white/20 rounded text-xs text-white/70 truncate">
                    {tv.device_name}
                  </div>

                  {/* Resize Handle */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 px-4 py-3 bg-transparent">
        <div className="flex items-center gap-6 text-xs text-white/40 px-3 py-2 bg-neutral-900/15 backdrop-blur-sm border border-white/[0.04] rounded-xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/5 border border-white/20 rounded flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <span>Drag to position TVs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/5 border border-white/20 rounded flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span>Scroll to zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Live preview</span>
          </div>
        </div>
      </div>
    </div>
  )
}

