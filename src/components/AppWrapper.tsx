'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import PWAInstaller from '../components/PWAInstaller'
import { Loader2 } from 'lucide-react'
import { pwaUtils } from '@/lib/pwa-utils'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // Initialize iPad Pro optimizations when app loads
    if (typeof window !== 'undefined') {
      pwaUtils.initializeIPadOptimizations()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div>
        <LoginForm />
        <PWAInstaller />
      </div>
    )  
  }

  return (
    <div>
      {children}
      <PWAInstaller />
    </div>
  )
} 