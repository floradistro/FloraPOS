/**
 * Supabase Client
 * Real-time database for TV control system
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment-specific URLs
const getSupabaseConfig = () => {
  const env = process.env.NEXT_PUBLIC_SUPABASE_ENV || 'local'
  
  console.log('🔧 Supabase env:', env)
  console.log('🔧 NEXT_PUBLIC_SUPABASE_URL_LOCAL:', process.env.NEXT_PUBLIC_SUPABASE_URL_LOCAL)
  console.log('🔧 NEXT_PUBLIC_SUPABASE_ANON_KEY_LOCAL:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LOCAL?.substring(0, 20) + '...')
  
  if (env === 'production') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION!,
    }
  }
  
  // Local development - FORCE correct JWT tokens (ignore env vars)
  const url = 'http://127.0.0.1:54321'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  console.log('✅ Using Supabase URL:', url)
  console.log('🔑 Using REAL JWT token (first 30 chars):', anonKey.substring(0, 30) + '...')
  
  return { url, anonKey }
}

const config = getSupabaseConfig()

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
})

// Helper to detect environment
export const isLocal = config.url.includes('localhost') || config.url.includes('127.0.0.1')
export const isProduction = config.url.includes('.supabase.co')

// Log current environment
if (typeof window !== 'undefined') {
  console.log(`🔧 Supabase: ${isLocal ? 'LOCAL' : 'PRODUCTION'} (${config.url})`)
}

// Export types
export type { Database }

