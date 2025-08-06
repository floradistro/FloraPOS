'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Store, Terminal, AuthContextType, LoginRequest } from '../types/auth'
import { authService } from '../lib/auth'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = () => {
      try {
        // Check if we're in the browser
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        let storedUser = authService.getStoredUser()
        let storedStore = authService.getStoredStore()
        let storedTerminal = authService.getStoredTerminal()
        let storedToken = authService.getToken()

        // Check if stored store has "Guava" and replace it
        if (storedStore && (storedStore.name === 'Guava' || storedStore.name === 'Store')) {
          storedStore = null // Force using default
        }

        // Set default values for development/testing
        const defaultUser = storedUser || {
          id: "1",
          email: "floradistrodev@gmail.com",
          firstName: "Master",
          lastName: "Admin",
          role: "admin" as any,
          storeId: "30",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const defaultStore = storedStore || {
          id: "30",
          name: "Charlotte Monroe",
          address: "Charlotte Monroe Location",
          phone: "(704) 555-0100",
          isActive: true,
          timezone: "America/New_York",
          currency: "USD",
          taxRate: 0.0825,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const defaultTerminal = storedTerminal || {
          id: "terminal-1",
          name: "Terminal 1",
          storeId: "30",
          isActive: true,
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const defaultToken = storedToken || "flora-pos-bypass-token"
        
        // Save the corrected store data
        if (!storedStore || storedStore.name === 'Guava' || storedStore.name === 'Store') {
          authService.setStore(defaultStore)
        }
        
        setUser(defaultUser)
        setStore(defaultStore)
        setTerminal(defaultTerminal)
        setToken(defaultToken)
      } catch (error) {
        // If there's an error accessing localStorage, just continue without auth
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials)
      
      setUser(response.user)
      setStore(response.store)
      setTerminal(response.terminal)
      setToken(response.token)
      
      toast.success(`Welcome back, ${response.user.firstName}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setStore(null)
      setTerminal(null)
      setToken(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear state even if API call fails
      setUser(null)
      setStore(null)
      setTerminal(null)
      setToken(null)
    }
  }

  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshToken()
      setToken(newToken)
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    store,
    terminal,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Permission hook
export function usePermissions() {
  const { user } = useAuth()
  
  const hasPermission = (permission: { action: string; resource: string }) => {
    if (!user) return false
    return authService.hasPermission(user, permission)
  }

  const canAccessStore = (storeId: string) => {
    if (!user) return false
    return authService.canAccessStore(user, storeId)
  }

  return {
    hasPermission,
    canAccessStore,
  }
} 