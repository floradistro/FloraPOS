'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import SiriGlowBorder from '../components/SiriGlowBorder'
import { useQuery } from '@tanstack/react-query'
import { floraAPI } from '../lib/woocommerce'
import { useOptimizedPreloading } from '../hooks/useOptimizedPreloading'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { isAuthenticated, isLoading: authLoading, store } = useAuth()
  const [isAppReady, setIsAppReady] = useState(false)



  // Use optimized preloading instead of bulk loading
  const { isLoading: optimizedLoading, isPreloadingComplete } = useOptimizedPreloading('all', {
    enableBackgroundPrefetch: true,
    preloadAdjacentCategories: true,
    maxPreloadItems: 20 // Only preload first page
  })

  // Determine if app is fully loaded
  // Only show loading for critical data when user is authenticated
  const isGlobalLoading = authLoading || (isAuthenticated && optimizedLoading)

  // Add a minimum loading time to prevent flash, but only when authenticated
  useEffect(() => {
    if (!isGlobalLoading && !isAppReady) {
      // If not authenticated, show login immediately
      // If authenticated, add minimum loading time for UX
      const delay = isAuthenticated ? 1500 : 0
      const timer = setTimeout(() => {
        setIsAppReady(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [isGlobalLoading, isAppReady, isAuthenticated])

  if ((isGlobalLoading || !isAppReady) && (authLoading || isAuthenticated)) {
    return (
      <>
        <SiriGlowBorder isLoading={true} />
        <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="Flora Distro"
              width={120}
              height={120}
              className="logo-fade-animation mx-auto mb-6"
              priority
            />
            <h2 className="flora-distro-text text-animated">Flora Distro</h2>
            <p className="text-text-secondary mt-2">Loading your workspace...</p>
          </div>
        </div>
      </>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <LoginForm />
      </div>
    )  
  }

  return (
    <div>
      {children}
    </div>
  )
} 