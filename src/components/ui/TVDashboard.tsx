/**
 * TV Dashboard - Grid View of All TVs
 * Shows all online TVs with live previews in a grid
 */

'use client'

import React, { useState } from 'react'
import { TVPreviewCard } from './TVPreview'

interface TVDevice {
  id: string
  tv_number: number
  device_name: string
  location_id: number
  last_seen: string | null
}

interface TVDashboardProps {
  tvDevices: TVDevice[]
  isOnline: (tv: TVDevice) => boolean
  onSelectTV: (tvId: string) => void
  selectedTV: string | null
  pushingTVs: Set<string>
}

export function TVDashboard({ 
  tvDevices, 
  isOnline, 
  onSelectTV, 
  selectedTV,
  pushingTVs 
}: TVDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const onlineTVs = tvDevices.filter(isOnline)
  
  if (onlineTVs.length === 0) return null

  return (
    <div className="mb-4">
      {/* Dashboard Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/30 text-white rounded-lg text-sm transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 012 2v8a2 2 0 01-2 2m-6 0h6" />
          </svg>
          <div className="text-left">
            <div className="font-semibold">Live TV Dashboard</div>
            <div className="text-xs text-white/60">{onlineTVs.length} online TVs • Real-time previews</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {pushingTVs.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full">
              <svg className="w-3 h-3 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs text-blue-400 font-medium">{pushingTVs.size} pushing</span>
            </div>
          )}
          
          <svg 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dashboard Grid */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-neutral-900/40 border border-white/10 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onlineTVs.map(tv => (
              <div
                key={tv.id}
                className={`relative group ${
                  selectedTV === tv.id 
                    ? 'ring-2 ring-blue-500 rounded-lg' 
                    : ''
                }`}
              >
                {/* TV Number Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                  <div className="px-2 py-1 bg-neutral-900/90 backdrop-blur-sm border border-white/20 rounded text-xs font-bold text-white shadow-lg">
                    TV {tv.tv_number}
                  </div>
                  {pushingTVs.has(tv.id) && (
                    <div className="px-2 py-1 bg-blue-500/90 backdrop-blur-sm border border-blue-400 rounded text-xs font-semibold text-white shadow-lg animate-pulse flex items-center gap-1">
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Pushing
                    </div>
                  )}
                </div>

                {/* Pushing Overlay */}
                {pushingTVs.has(tv.id) && (
                  <div className="absolute inset-0 z-20 bg-blue-500/20 border-2 border-blue-500 rounded-lg animate-pulse pointer-events-none" />
                )}

                {/* Preview */}
                <TVPreviewCard
                  tvId={tv.id}
                  tvNumber={tv.tv_number}
                  locationId={tv.location_id}
                  isOnline={true}
                  onClick={() => onSelectTV(tv.id)}
                />

                {/* TV Name */}
                <div className="mt-2 text-xs text-white/70 text-center truncate px-1">
                  {tv.device_name}
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Stats */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{onlineTVs.length} Online</span>
              </div>
              {pushingTVs.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{pushingTVs.size} Pushing</span>
                </div>
              )}
            </div>
            <div className="text-white/40">
              Click any TV to control • Updates every 5 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

