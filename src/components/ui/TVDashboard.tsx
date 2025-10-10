/**
 * TV Dashboard - Grid View of All TVs
 * Shows all online TVs with live previews in a grid
 */

'use client'

import React, { useState } from 'react'
import { TVPreviewCard } from './TVPreview'
import type { Database } from '@/types/supabase'

type TVDevice = Database['public']['Tables']['tv_devices']['Row']

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
  const [isExpanded, setIsExpanded] = useState(true)
  
  const onlineTVs = tvDevices.filter(isOnline)
  
  if (onlineTVs.length === 0) return null

  return (
    <div className="mb-3">
      {/* Dashboard Toggle - Minimal */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white rounded-xl text-xs transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/60 font-medium">Live</span>
          <span className="text-white/80 font-mono">{onlineTVs.length}</span>
        </div>
        
        <svg 
          className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dashboard Grid */}
      {isExpanded && (
        <div className="mt-2 p-2 bg-white/[0.02] border border-white/10 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
            {onlineTVs.map(tv => (
              <div
                key={tv.id}
                className={`relative group ${
                  selectedTV === tv.id 
                    ? 'ring-2 ring-blue-500 rounded-lg' 
                    : ''
                }`}
              >
                {/* TV Number Badge - Minimal */}
                <div className="absolute top-1.5 left-1.5 z-10">
                  <div className="px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg text-[10px] font-mono text-white/90">
                    {tv.tv_number}
                  </div>
                </div>

                {/* Preview */}
                <TVPreviewCard
                  tvId={tv.id}
                  tvNumber={tv.tv_number}
                  locationId={tv.location_id}
                  isOnline={true}
                  onClick={() => onSelectTV(tv.id)}
                />
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

