/**
 * useTVDevices Hook
 * Manages TV devices with real-time updates
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type TVDevice = Database['public']['Tables']['tv_devices']['Row']

interface UseTVDevicesOptions {
  locationId?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useTVDevices(options: UseTVDevicesOptions = {}) {
  const { locationId, autoRefresh = true, refreshInterval = 5000 } = options
  
  const [devices, setDevices] = useState<TVDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch devices and clean up old ones
  const fetchDevices = async () => {
    try {
      // First, delete TVs offline for > 5 minutes
      await supabase
        .from('tv_devices')
        .delete()
        .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      let query = supabase
        .from('tv_devices')
        .select('*')
        .order('tv_number', { ascending: true })

      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setDevices(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch TV devices:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    fetchDevices()

    if (!autoRefresh) return

    // Subscribe to changes
    const channel = supabase
      .channel('tv-devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tv_devices',
          filter: locationId ? `location_id=eq.${locationId}` : undefined,
        },
        (payload) => {
          console.log('TV device changed:', payload)
          fetchDevices() // Refresh on any change
        }
      )
      .subscribe()

    // Auto-refresh interval (backup for missed events)
    const interval = setInterval(fetchDevices, refreshInterval)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [locationId, autoRefresh, refreshInterval])

  // Helper: Check if TV is online (last seen < 20s ago)
  const isOnline = (device: TVDevice): boolean => {
    if (!device.last_seen) return false
    const lastSeen = new Date(device.last_seen).getTime()
    const now = Date.now()
    return (now - lastSeen) < 20000 // 20 seconds - faster detection
  }

  // Helper: Get online count
  const onlineCount = devices.filter(isOnline).length

  // Helper: Get offline count
  const offlineCount = devices.length - onlineCount

  return {
    devices,
    loading,
    error,
    refresh: fetchDevices,
    isOnline,
    onlineCount,
    offlineCount,
  }
}

