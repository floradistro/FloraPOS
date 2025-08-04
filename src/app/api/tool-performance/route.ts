import { NextRequest, NextResponse } from 'next/server'
import { getToolPerformanceReport, getCacheStats } from '@/claude-agent/tools/executor'

export async function GET(request: NextRequest) {
  try {
    const performanceReport = getToolPerformanceReport()
    const cacheStats = getCacheStats()
    
    return NextResponse.json({
      performance: performanceReport,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Tool performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { clearToolCache } = await import('@/claude-agent/tools/executor')
    clearToolCache()
    
    return NextResponse.json({
      message: 'Tool cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}