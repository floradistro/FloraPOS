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
    // Initialize auth state from localStorage and fetch real store data
    const initializeAuth = async () => {
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

        // Check if stored store has fake data and replace it
        if (storedStore && (storedStore.name === 'Guava' || storedStore.name === 'Store' || storedStore.name === 'Charlotte Monroe' || storedStore.name === 'Charlotte Central' || storedStore.name === 'Distribution Center')) {
          storedStore = null // Force fetching real data
          // Also clear from localStorage
          try {
            localStorage.removeItem('flora_store')
            localStorage.removeItem('flora_user_data_encrypted')
            console.log('🗑️ Cleared fake store data from localStorage')
          } catch (error) {
            console.warn('Could not clear localStorage:', error)
          }
        }

        // Only use stored user data - no fake defaults
        if (!storedUser) {
          console.log('❌ No authenticated user - login required')
          setIsLoading(false)
          return
        }
        
        const defaultUser = storedUser
        
        // Try to fetch real store data from API
        let realStore = storedStore
        let realTerminal = storedTerminal
        
        if (!storedStore) {
          try {
            console.log('🏪 Fetching real store data from API...')
            const storesResponse = await fetch('/api/stores/public')
            if (storesResponse.ok) {
              const stores = await storesResponse.json()
              if (stores && stores.length > 0) {
                // Use the first available store
                const firstStore = stores[0]
                realStore = {
                  id: firstStore.id?.toString() || firstStore.location_id?.toString() || "1",
                  name: firstStore.name || firstStore.location_name || "Main Store",
                  address: firstStore.address || "Store Address",
                  phone: firstStore.phone || "(555) 000-0000",
                  isActive: true,
                  timezone: "America/New_York",
                  currency: "USD",
                  taxRate: 0.0825,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
                
                realTerminal = {
                  id: "terminal-1",
                  name: "Terminal 1",
                  storeId: realStore.id,
                  isActive: true,
                  lastActivity: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
                
                // Save real store data
                authService.setStore(realStore)
                authService.setTerminal(realTerminal)
                console.log('✅ Using real store:', realStore.name)
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch real store data:', error)
          }
        }
        
        // NO FALLBACK - Require real authentication
        if (!realStore) {
          console.log('❌ No real store data available - user must login properly')
          // Don't set any fake data - user must authenticate properly
          setIsLoading(false)
          return
        }
        
        if (!realTerminal) {
          realTerminal = {
            id: "terminal-1",
            name: "Terminal 1",
            storeId: realStore.id,
            isActive: true,
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        
        const defaultToken = storedToken // No bypass token - require real auth
        
        setUser(defaultUser)
        setStore(realStore)
        setTerminal(realTerminal)
        setToken(defaultToken)
      } catch (error) {
        console.error('Auth initialization error:', error)
        // No fake data - require proper authentication
        setUser(null)
        setStore(null)
        setTerminal(null)
        setToken(null)
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