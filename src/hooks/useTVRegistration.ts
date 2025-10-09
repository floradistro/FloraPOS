/**
 * useTVRegistration Hook
 * Registers TV display and listens for commands
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TVCommandService } from '@/services/tv-command-service'

interface UseTVRegistrationOptions {
  tvId: string | null
  tvNumber?: number
  locationId?: number
  deviceName?: string
  currentConfigId?: number
  onCommand?: (command: any) => void
}

export function useTVRegistration(options: UseTVRegistrationOptions) {
  const {
    tvId,
    tvNumber = 1,
    locationId = 20,
    deviceName = `TV ${tvNumber}`,
    currentConfigId,
    onCommand,
  } = options

  const [isRegistered, setIsRegistered] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const [lastCommand, setLastCommand] = useState<any>(null)

  // Register TV device
  const registerDevice = useCallback(async () => {
    if (!tvId) {
      return
    }

    try {
      // Delete any existing TV with same number and location first
      await supabase
        .from('tv_devices')
        .delete()
        .eq('tv_number', tvNumber)
        .eq('location_id', locationId)
      
      // Then insert fresh
      const { data, error } = await supabase
        .from('tv_devices')
        .insert({
          id: tvId,
          tv_number: tvNumber,
          location_id: locationId,
          device_name: deviceName,
          current_config_id: currentConfigId,
          status: 'online',
          last_seen: new Date().toISOString(),
          ip_address: typeof window !== 'undefined' ? window.location.hostname : null,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        })
        .select()

      if (error) throw error

      setIsRegistered(true)
      setConnectionStatus('online')
    } catch (error) {
      setConnectionStatus('offline')
    }
  }, [tvId, tvNumber, locationId, deviceName, currentConfigId])

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!tvId || !isRegistered) {
      return
    }

    try {
      await supabase
        .from('tv_devices')
        .update({
          status: 'online',
          last_seen: new Date().toISOString(),
          current_config_id: currentConfigId,
        })
        .eq('id', tvId)
      
    } catch (error) {
      setConnectionStatus('offline')
    }
  }, [tvId, isRegistered, currentConfigId])

  // Execute command
  const executeCommand = useCallback(async (command: any) => {
    setLastCommand(command)

    try {
      const startTime = Date.now()
      let success = true
      let errorMessage = ''

      // Execute based on command type
      switch (command.command_type) {
        case 'refresh':
          window.location.reload()
          break

        case 'change_config':
          if (command.payload?.url) {
            window.location.href = command.payload.url
          } else if (command.payload?.config_id) {
            // Just config ID - update param
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.set('config_id', command.payload.config_id.toString())
            window.location.href = newUrl.toString()
          }
          break

        case 'update_theme':
          // Theme updates would be handled by parent component
          if (onCommand) {
            onCommand(command)
          }
          break

        case 'clear_cache':
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
            window.location.reload()
          }
          break

        case 'ping':
          // Just respond
          break

        default:
          if (onCommand) {
            onCommand(command)
          }
      }

      // Mark command as completed
      await TVCommandService.markCompleted(command.id, success, errorMessage)

      // Log execution
      const latency = Date.now() - startTime
      await supabase.from('tv_command_log').insert({
        tv_id: tvId!,
        command_type: command.command_type,
        payload: command.payload,
        success,
        error_message: errorMessage || null,
        latency_ms: latency,
      })

    } catch (error: any) {
      await TVCommandService.markCompleted(command.id, false, error.message)
    }
  }, [tvId, onCommand])

  // Subscribe to commands
  useEffect(() => {
    if (!tvId || !isRegistered) {
      return
    }

    const channel = supabase
      .channel(`tv-commands-${tvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tv_commands',
          filter: `tv_id=eq.${tvId}`,
        },
        (payload) => {
          if (payload.new.status === 'pending') {
            executeCommand(payload.new)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          checkPendingCommands()
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tvId, isRegistered, executeCommand])
  
  // Check for pending commands on mount
  const checkPendingCommands = useCallback(async () => {
    if (!tvId) return
    
    try {
      const { data, error } = await supabase
        .from('tv_commands')
        .select('*')
        .eq('tv_id', tvId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        for (const command of data) {
          await executeCommand(command)
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, [tvId, executeCommand])

  // Register on mount and check pending commands
  useEffect(() => {
    if (tvId) {
      registerDevice().then(() => {
        setTimeout(() => {
          checkPendingCommands()
        }, 1000)
      })
    }
  }, [tvId])
  
  // POLL for pending commands every 5 seconds (backup for when WebSocket fails)
  useEffect(() => {
    if (!tvId || !isRegistered) return
    
    const interval = setInterval(() => {
      checkPendingCommands()
    }, 5000) // Check every 5 seconds for responsive feel
    
    return () => {
      clearInterval(interval)
    }
  }, [tvId, isRegistered, checkPendingCommands])

  // Heartbeat every 10 seconds for real-time status
  useEffect(() => {
    if (!isRegistered) {
      return
    }
    
    // Send first heartbeat immediately
    sendHeartbeat()
    
    // Then every 10 seconds
    const interval = setInterval(() => {
      sendHeartbeat()
    }, 10000)
    
    return () => {
      clearInterval(interval)
    }
  }, [isRegistered, sendHeartbeat])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tvId && isRegistered) {
        supabase
          .from('tv_devices')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString(),
          })
          .eq('id', tvId)
      }
    }
  }, [tvId, isRegistered])

  return {
    isRegistered,
    connectionStatus,
    lastCommand,
    registerDevice,
    sendHeartbeat,
  }
}

