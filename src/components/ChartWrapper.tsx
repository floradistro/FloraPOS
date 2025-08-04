'use client'

import { useEffect, useState } from 'react'
import SimpleChartRenderer from './SimpleChartRenderer'

interface ChartWrapperProps {
  json: string
  isStreaming?: boolean
}

export default function ChartWrapper({ json, isStreaming = false }: ChartWrapperProps) {
  const [showError, setShowError] = useState(false)
  const [isValidJson, setIsValidJson] = useState(false)
  
  useEffect(() => {
    // Reset error state when json changes
    setShowError(false)
    
    // Check if JSON is valid
    try {
      const parsed = JSON.parse(json)
      setIsValidJson(true)
    } catch {
      setIsValidJson(false)
      
      // Only show error after a delay if not streaming
      // This prevents showing errors for incomplete JSON during streaming
      if (!isStreaming) {
        const timer = setTimeout(() => {
          setShowError(true)
        }, 1500) // 1.5 second delay
        
        return () => clearTimeout(timer)
      }
    }
  }, [json, isStreaming])
  
  // If JSON is invalid and we should show a loading state
  if (!isValidJson && !showError) {
    return (
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-5 mb-3 border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
            <div className="absolute inset-1 rounded-full bg-gray-900 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-transparent border-t-blue-400 border-l-blue-400 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-100">Generating Chart</h4>
            <p className="text-xs text-gray-400 mt-0.5">Analyzing and visualizing data...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // If JSON is invalid and we should show an error
  if (!isValidJson && showError) {
    return (
      <div className="bg-black/20 border border-red-500/20 rounded-lg p-4 mb-2">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-lg">⚠️</div>
          <div className="flex-1">
            <div className="text-red-400 text-sm font-medium">Chart Generation Error</div>
            <div className="text-gray-400 text-xs mt-1">
              Unable to parse chart data. The data format may be incomplete or invalid.
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // JSON is valid, render the chart
  return <SimpleChartRenderer json={json} />
}