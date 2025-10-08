/**
 * Supabase Client
 * Real-time database for TV control system
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment-specific URLs
const getSupabaseConfig = () => {
  // ALWAYS use production Supabase by default (unless explicitly running locally)
  const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  
  // Production Supabase (default for deployed sites)
  const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfkshvmqqgosvcwztqyq.supabase.co'
  const productionKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjg4ODIsImV4cCI6MjA3MDYwNDg4Mn0.9suNxH4gFmic5e4bG-P44e_qELYCx0KZI4VCvrNC2_E'
  
  // Local development (only when on localhost)
  if (isLocalDev) {
    const localUrl = 'http://127.0.0.1:54321'
    const localKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    
    console.log('🔧 Supabase: LOCAL DEV')
    console.log('✅ URL:', localUrl)
    
    return { url: localUrl, anonKey: localKey }
  }
  
  // Production (default)
  console.log('🔧 Supabase: PRODUCTION')
  console.log('✅ URL:', productionUrl)
  
  return { url: productionUrl, anonKey: productionKey }
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

