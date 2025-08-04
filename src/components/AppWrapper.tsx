'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import { Loader2 } from 'lucide-react'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth()



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
      </div>
    )  
  }

  return (
    <div>
      {children}
    </div>
  )
} 