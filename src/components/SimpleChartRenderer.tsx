'use client'

import { useEffect, useState } from 'react'

interface ChartData {
  type: 'line' | 'bar' | 'pie'
  data: any[]
  title?: string
}

interface SimpleChartRendererProps {
  json: string
}

export default function SimpleChartRenderer({ json }: SimpleChartRendererProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  console.log('SimpleChartRenderer received JSON:', json)
  
  if (!isClient) {
    return (
      <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 mb-2">
        <div className="text-gray-400 text-sm">Loading chart...</div>
      </div>
    )
  }
  
  try {
    const chartData: ChartData = JSON.parse(json)
    console.log('Parsed chart data:', chartData)
    
    if (!chartData.type || !chartData.data) {
      console.error('❌ Invalid chart data - missing type or data:', chartData)
      return <div className="text-red-400 text-sm">Invalid chart data: {JSON.stringify(chartData)}</div>
    }

    if (!Array.isArray(chartData.data) || chartData.data.length === 0) {
      console.error('❌ Chart data is not a valid array:', chartData.data)
      return <div className="text-red-400 text-sm">Chart data must be a non-empty array</div>
    }

    console.log('✅ Chart data validation passed, rendering simple chart type:', chartData.type)

    const containerStyle = {
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '8px',
      width: '100%',
      maxWidth: '100%'
    }

    // Get max value for scaling
    const maxValue = Math.max(...chartData.data.map(item => {
      if (typeof item.value === 'number') return item.value
      // Handle multi-series data
      const values = Object.keys(item).filter(key => key !== 'name').map(key => item[key])
      return Math.max(...values.filter(v => typeof v === 'number'))
    }))

    if (chartData.type === 'bar') {
      return (
        <div style={containerStyle}>
          {chartData.title && (
            <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
          )}
          <div className="space-y-3">
            {chartData.data.map((item, index) => {
              // Handle single value data
              if (typeof item.value === 'number') {
                const percentage = (item.value / maxValue) * 100
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-300 text-right font-medium">{item.name}</div>
                    <div className="flex-1 bg-gray-800 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-white font-medium">
                        {item.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              } else {
                // Handle multi-series data (e.g., Charlotte vs Blowing Rock)
                const dataKeys = Object.keys(item).filter(key => key !== 'name')
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
                
                return (
                  <div key={index} className="mb-6">
                    <div className="text-sm text-gray-300 mb-3 font-medium">{item.name}</div>
                    {dataKeys.map((key, keyIndex) => {
                      const value = item[key]
                      if (typeof value !== 'number') return null
                      const percentage = (value / maxValue) * 100
                      
                      return (
                        <div key={key} className="flex items-center gap-4 mb-2">
                          <div className="w-24 text-sm text-gray-400 text-right">{key}</div>
                          <div className="flex-1 bg-gray-800 rounded-full h-7 relative overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: colors[keyIndex % colors.length]
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-white font-medium">
                              {value.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            })}
          </div>
        </div>
      )
    }

    if (chartData.type === 'pie') {
      // Calculate total for percentages
      const total = chartData.data.reduce((sum, item) => {
        const value = typeof item.value === 'number' ? item.value : 0
        return sum + value
      }, 0)

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
      
      // Calculate angles for pie slices
      let currentAngle = 0
      const slices = chartData.data.map((item, index) => {
        const value = typeof item.value === 'number' ? item.value : 0
        const percentage = (value / total) * 100
        const angle = (value / total) * 360
        const startAngle = currentAngle
        currentAngle += angle
        
        return {
          name: item.name,
          value,
          percentage,
          angle,
          startAngle,
          color: colors[index % colors.length]
        }
      })

      return (
        <div style={containerStyle}>
          {chartData.title && (
            <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
          )}
          <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
            {/* Pie Chart */}
            <div className="relative flex-shrink-0 mx-auto lg:mx-0">
              <svg width="280" height="280" className="transform -rotate-90">
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="transparent"
                  stroke="#374151"
                  strokeWidth="2"
                />
                {slices.map((slice, index) => {
                  if (slice.value === 0) return null
                  
                  const radius = 120
                  const centerX = 140
                  const centerY = 140
                  
                  // Calculate path for pie slice
                  const startAngleRad = (slice.startAngle * Math.PI) / 180
                  const endAngleRad = ((slice.startAngle + slice.angle) * Math.PI) / 180
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad)
                  const y1 = centerY + radius * Math.sin(startAngleRad)
                  const x2 = centerX + radius * Math.cos(endAngleRad)
                  const y2 = centerY + radius * Math.sin(endAngleRad)
                  
                  const largeArcFlag = slice.angle > 180 ? 1 : 0
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ')
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={slice.color}
                      stroke="#1f2937"
                      strokeWidth="1"
                    />
                  )
                })}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="text-sm text-gray-400 font-medium mb-4">Distribution</div>
              {slices.map((slice, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1 text-sm text-gray-200 font-medium min-w-0 truncate">
                    {slice.name}
                  </div>
                  <div className="text-sm text-blue-300 font-medium">
                    {slice.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400 w-20 text-right font-mono">
                    {slice.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (chartData.type === 'line') {
      // Simple line chart using SVG
      const values = chartData.data.map(item => typeof item.value === 'number' ? item.value : 0)
      const maxValue = Math.max(...values)
      const minValue = Math.min(...values)
      const range = maxValue - minValue || 1
      
      const width = 600
      const height = 300
      const padding = 60
      
      const points = chartData.data.map((item, index) => {
        const x = padding + (index / (chartData.data.length - 1)) * (width - 2 * padding)
        const value = typeof item.value === 'number' ? item.value : 0
        const y = height - padding - ((value - minValue) / range) * (height - 2 * padding)
        return { x, y, value, name: item.name }
      })
      
      const pathData = points.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ')

      return (
        <div style={containerStyle}>
          {chartData.title && (
            <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
          )}
          <div className="relative w-full max-w-full overflow-hidden">
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border border-gray-700 rounded w-full max-w-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={ratio}
                  x1={padding}
                  y1={height - padding - ratio * (height - 2 * padding)}
                  x2={width - padding}
                  y2={height - padding - ratio * (height - 2 * padding)}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
              
              {/* Line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              
              {/* Points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3B82F6"
                  stroke="#1f2937"
                  strokeWidth="2"
                />
              ))}
              
              {/* Labels */}
              {points.map((point, index) => (
                <text
                  key={index}
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9CA3AF"
                >
                  {point.name}
                </text>
              ))}
            </svg>
          </div>
        </div>
      )
    }

    // Fallback for unknown chart types
    return (
      <div style={containerStyle}>
        {chartData.title && (
          <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
        )}
        <div className="text-gray-400 text-sm">
          Unsupported chart type: {chartData.type} ({chartData.data.length} data points)
        </div>
        <div className="mt-2 space-y-1">
          {chartData.data.map((item, index) => (
            <div key={index} className="text-xs text-gray-300">
              {item.name}: {JSON.stringify(item).replace(/[{}]/g, '').replace(/"/g, '')}
            </div>
          ))}
        </div>
      </div>
    )

  } catch (error) {
    console.error('❌ SimpleChartRenderer JSON parse error:', error)
    console.error('❌ Failed to parse JSON:', json)
    return (
      <div className="text-red-400 text-sm p-2 bg-red-900/20 border border-red-500/20 rounded">
        <div>Error parsing chart data:</div>
        <div className="text-xs mt-1">{error instanceof Error ? error.message : 'Unknown error'}</div>
        <div className="text-xs mt-1 opacity-70">JSON: {json.substring(0, 100)}...</div>
      </div>
    )
  }
}