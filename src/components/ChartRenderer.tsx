'use client'

import dynamic from 'next/dynamic'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface ChartData {
  type: 'line' | 'bar' | 'pie'
  data: any[]
  xAxis?: string[]
  title?: string
  colors?: string[]
}

interface ChartRendererProps {
  json: string
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500  
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
]

export default function ChartRenderer({ json }: ChartRendererProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  console.log('📊 ChartRenderer received JSON:', json)
  
  if (!isClient) {
    return (
      <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 mb-2">
        <div className="text-gray-400 text-sm">Loading chart...</div>
      </div>
    )
  }
  
  try {
    const chartData: ChartData = JSON.parse(json)
    console.log('📊 Parsed chart data:', chartData)
    
    if (!chartData.type || !chartData.data) {
      console.error('❌ Invalid chart data - missing type or data:', chartData)
      return <div className="text-red-400 text-sm">Invalid chart data: {JSON.stringify(chartData)}</div>
    }

    if (!Array.isArray(chartData.data) || chartData.data.length === 0) {
      console.error('❌ Chart data is not a valid array:', chartData.data)
      return <div className="text-red-400 text-sm">Chart data must be a non-empty array</div>
    }

    console.log('✅ Chart data validation passed, rendering chart type:', chartData.type)

    const containerStyle = {
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px'
    }

    switch (chartData.type) {
      case 'line':
        return (
          <div style={containerStyle}>
            {chartData.title && (
              <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                {/* Dynamically render lines based on data keys */}
                {chartData.data.length > 0 && Object.keys(chartData.data[0]).filter(key => key !== 'name').map((key, index) => (
                  <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length], strokeWidth: 2, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )

      case 'bar':
        return (
          <div style={containerStyle}>
            {chartData.title && (
              <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                {/* Dynamically render bars based on data keys */}
                {chartData.data.length > 0 && Object.keys(chartData.data[0]).filter(key => key !== 'name').map((key, index) => (
                  <Bar 
                    key={key}
                    dataKey={key} 
                    fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case 'pie':
        return (
          <div style={containerStyle}>
            {chartData.title && (
              <div className="text-gray-300 text-sm font-medium mb-3">{chartData.title}</div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.data}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {chartData.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )

      default:
        return <div className="text-yellow-400 text-sm">Unsupported chart type: {chartData.type}</div>
    }
  } catch (error) {
    console.error('❌ ChartRenderer JSON parse error:', error)
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