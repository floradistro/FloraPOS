/**
 * Supabase Client
 * Real-time database for TV control system
 * Respects docker/production toggle (same as WordPress API)
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Production Supabase credentials (hardcoded as fallback for edge runtime)
const PRODUCTION_URL = 'https://nfkshvmqqgosvcwztqyq.supabase.co'
const PRODUCTION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ma3Nodm1xcWdvc3Zjd3p0cXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjg4ODIsImV4cCI6MjA3MDYwNDg4Mn0.9suNxH4gFmic5e4bG-P44e_qELYCx0KZI4VCvrNC2_E'

// Get environment-specific URLs
const getSupabaseConfig = () => {
  // Server-side/Edge Runtime: Always use production
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PRODUCTION_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PRODUCTION_KEY
    console.log('🔧 Supabase [Server/Edge]: PRODUCTION')
    console.log('✅ URL:', url)
    return { url, anonKey: key }
  }
  
  // Client-side: Check docker/production toggle
  const isLocalhost = window.location.hostname === 'localhost'
  
  // Check localStorage toggle
  let apiEnvironment = 'production';
  try {
    apiEnvironment = localStorage.getItem('flora_pos_api_environment') || 'production';
  } catch (e) {
    // localStorage not available
  }
  
  const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || PRODUCTION_URL
  const productionKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PRODUCTION_KEY
  
  // Local Supabase (when docker is active)
  const localUrl = 'http://127.0.0.1:54321'
  const localKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  // Use local ONLY if on localhost AND toggle is set to 'docker'
  if (isLocalhost && apiEnvironment === 'docker') {
    console.log('🔧 Supabase [Client]: LOCAL DEV (Docker Mode)')
    console.log('✅ URL:', localUrl)
    return { url: localUrl, anonKey: localKey }
  }
  
  // Otherwise use production
  console.log('🔧 Supabase [Client]: PRODUCTION')
  console.log('✅ URL:', productionUrl)
  console.log('📡 Toggle:', apiEnvironment)
  
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

