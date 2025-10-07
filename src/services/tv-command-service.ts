/**
 * TV Command Service
 * Handles sending commands to TV displays via Supabase realtime
 */

import { supabase } from '@/lib/supabase'

export type CommandType = 
  | 'change_config'
  | 'refresh'
  | 'screenshot'
  | 'update_theme'
  | 'ping'
  | 'reboot'
  | 'clear_cache'

export interface TVCommand {
  id?: string
  tv_id: string
  command_type: CommandType
  payload?: any
  status?: 'pending' | 'sent' | 'completed' | 'failed'
  created_at?: string
}

export class TVCommandService {
  /**
   * Send command to a specific TV
   */
  static async sendCommand(
    tvId: string,
    commandType: CommandType,
    payload: any = {}
  ): Promise<TVCommand | null> {
    try {
      const { data, error } = await supabase
        .from('tv_commands')
        .insert({
          tv_id: tvId,
          command_type: commandType,
          payload,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Command sent to TV: ${commandType}`, data)
      return data as TVCommand
    } catch (error) {
      console.error('Failed to send command:', error)
      return null
    }
  }

  /**
   * Send command to multiple TVs
   */
  static async sendCommandToMultiple(
    tvIds: string[],
    commandType: CommandType,
    payload: any = {}
  ): Promise<boolean> {
    try {
      const commands = tvIds.map(tvId => ({
        tv_id: tvId,
        command_type: commandType,
        payload,
        status: 'pending' as const,
      }))

      const { error } = await supabase
        .from('tv_commands')
        .insert(commands)

      if (error) throw error

      console.log(`✅ Broadcast command to ${tvIds.length} TVs: ${commandType}`)
      return true
    } catch (error) {
      console.error('Failed to broadcast command:', error)
      return false
    }
  }

  /**
   * Broadcast command to all TVs at a location
   */
  static async broadcastToLocation(
    locationId: number,
    commandType: CommandType,
    payload: any = {}
  ): Promise<boolean> {
    try {
      // Get all TVs at this location
      const { data: tvs, error: fetchError } = await supabase
        .from('tv_devices')
        .select('id')
        .eq('location_id', locationId)

      if (fetchError) throw fetchError
      if (!tvs || tvs.length === 0) {
        console.warn('No TVs found at location:', locationId)
        return false
      }

      const tvIds = tvs.map(tv => tv.id)
      return await this.sendCommandToMultiple(tvIds, commandType, payload)
    } catch (error) {
      console.error('Failed to broadcast to location:', error)
      return false
    }
  }

  /**
   * Get command history for a TV
   */
  static async getCommandHistory(tvId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('tv_command_log')
        .select('*')
        .eq('tv_id', tvId)
        .order('executed_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get command history:', error)
      return []
    }
  }

  /**
   * Get command statistics
   */
  static async getCommandStats(locationId?: number) {
    try {
      let query = supabase
        .from('tv_command_log')
        .select('command_type, success, latency_ms, executed_at')

      if (locationId) {
        // Filter by location through tv_devices
        const { data: tvs } = await supabase
          .from('tv_devices')
          .select('id')
          .eq('location_id', locationId)

        if (tvs) {
          const tvIds = tvs.map(tv => tv.id)
          query = query.in('tv_id', tvIds)
        }
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate stats
      const stats = {
        total: data?.length || 0,
        success: data?.filter(c => c.success).length || 0,
        failed: data?.filter(c => !c.success).length || 0,
        avgLatency: data?.reduce((sum, c) => sum + (c.latency_ms || 0), 0) / (data?.length || 1) || 0,
        byType: {} as Record<string, number>,
      }

      // Group by command type
      data?.forEach(cmd => {
        stats.byType[cmd.command_type] = (stats.byType[cmd.command_type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Failed to get command stats:', error)
      return null
    }
  }

  /**
   * Mark command as completed (called by TV)
   */
  static async markCompleted(commandId: string, success: boolean, error?: string) {
    try {
      const { error: updateError } = await supabase
        .from('tv_commands')
        .update({
          status: success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          error_message: error,
        })
        .eq('id', commandId)

      if (updateError) throw updateError

      return true
    } catch (error) {
      console.error('Failed to mark command as completed:', error)
      return false
    }
  }
}

export default TVCommandService

