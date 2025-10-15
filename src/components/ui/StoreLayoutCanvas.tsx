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
  const [showGrid, setShowGrid] = useState(true)
  const [selectedTV, setSelectedTV] = useState<string | null>(null)

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

  const handleAddTV = () => {
    // Add a new TV at a default position
    const newId = `temp-${Date.now()}`
    const newPosition: TVPosition = {
      tvId: newId,
      x: 200,
      y: 200,
      width: 400,
      height: 225,
      orientation: 'horizontal'
    }
    setPositions(prev => new Map(prev).set(newId, newPosition))
    setSelectedTV(newId)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent w-full h-full pr-4 rounded-2xl">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
          <h2 className="text-sm font-medium text-white/90" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)', fontFamily: 'Tiempos, serif' }}>Store Layout Builder</h2>
          <div className="w-px h-4 bg-white/[0.06]" />
          <span className="text-xs text-white/50 font-medium">
            {tvDevices.length} TVs • {tvDevices.filter(isOnline).length} Online
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add Menu to Canvas */}
          <div className="flex items-center gap-2 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-1.5" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
            <button
              onClick={handleAddTV}
              className="flex items-center gap-1.5 px-3 h-[26px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.16] text-white/70 hover:text-white rounded-full text-xs font-medium transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
              }}
              title="Add a new TV menu to canvas"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Menu
            </button>
            
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 h-[26px] border rounded-full text-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center ${
                showGrid 
                  ? 'bg-white/[0.12] border-white/[0.16] text-white/90' 
                  : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70'
              }`}
              style={{ boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)' }}
              title={showGrid ? "Hide grid" : "Show grid"}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-neutral-900/30 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-1.5" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)' }}>
            <button
              onClick={() => handleZoom(-0.1)}
              className="px-2 h-[26px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white/60 hover:text-white/80 rounded-full text-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 flex items-center justify-center"
              style={{ boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)' }}
              title="Zoom out"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-white/50 w-10 text-center font-medium" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => handleZoom(0.1)}
              className="px-2 h-[26px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white/60 hover:text-white/80 rounded-full text-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 flex items-center justify-center"
              style={{ boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)' }}
              title="Zoom in"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <div className="w-px h-5 bg-white/[0.06]" />
            
            <button
              onClick={() => setScale(1)}
              className="px-3 h-[26px] bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.16] text-white/80 hover:text-white rounded-full text-xs font-medium transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              style={{ 
                boxShadow: '0 2px 12px rgba(255, 255, 255, 0.02)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-auto relative ml-2 my-2 mr-6 min-h-0 rounded-xl"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedTV(null)}
        style={{
          backgroundImage: showGrid ? `radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)` : 'none',
          backgroundSize: '20px 20px',
          cursor: dragging ? 'grabbing' : 'default',
          backgroundColor: 'transparent'
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
                className={`absolute group ${dragging === tvId ? 'z-50' : selectedTV === tvId ? 'z-40' : 'z-10'}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${pos.width}px`,
                  height: `${pos.height}px`,
                  cursor: dragging === tvId ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(tvId, e)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTV(tvId)
                }}
              >
                {/* TV Container */}
                <div className={`relative w-full h-full rounded-lg border-2 transition-all ${
                  dragging === tvId 
                    ? 'border-white/60 shadow-2xl' 
                    : selectedTV === tvId
                      ? 'border-white/40 shadow-xl'
                    : online 
                      ? 'border-white/15 hover:border-white/30 shadow-lg' 
                      : 'border-white/08 opacity-40'
                }`} style={{
                  boxShadow: selectedTV === tvId || dragging === tvId 
                    ? '0 12px 48px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                    : '0 4px 24px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* TV Preview */}
                  <TVPreviewIframe tvId={tv.id} tvNumber={tv.tv_number} locationId={locationId} />

                  {/* TV Label */}
                  <div className="absolute top-2 left-2 z-20 px-2.5 py-1.5 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.12] rounded-lg text-xs font-medium text-white/90 shadow-lg flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-white/20'}`} style={{
                      boxShadow: online ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'
                    }} />
                    <span style={{ fontFamily: 'Tiempos, serif' }}>TV {tv.tv_number}</span>
                  </div>

                  {/* TV Name */}
                  <div className="absolute bottom-2 left-2 right-2 z-20 px-2.5 py-1.5 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.12] rounded-lg text-xs text-white/60 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                    {tv.device_name}
                  </div>

                  {/* Selection Indicator */}
                  {selectedTV === tvId && (
                    <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-lg border-2 border-white/40 pointer-events-none" style={{
                      boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
                    }} />
                  )}

                  {/* Resize Handle */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-white/20 opacity-0 group-hover:opacity-60 transition-opacity rounded-br" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 px-4 py-3 bg-transparent">
        <div className="flex items-center gap-6 text-xs text-white/40 px-3 py-2 bg-neutral-900/20 backdrop-blur-xl border border-white/[0.04] rounded-xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)', fontFamily: 'Tiempos, serif' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/[0.04] border border-white/[0.12] rounded flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <span>Drag to position TVs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/[0.04] border border-white/[0.12] rounded flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Click to select</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74, 222, 128, 0.4)' }} />
            <span>Live preview</span>
          </div>
        </div>
      </div>
    </div>
  )
}

