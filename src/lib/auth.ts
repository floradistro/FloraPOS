// Real auth service that calls the API
import { User, Store, Terminal, LoginRequest, LoginResponse, UserRole } from '../types/auth'
import { authStorage } from './secure-storage'

class AuthService {
  private readonly TOKEN_KEY = 'flora_pos_token'
  private readonly USER_KEY = 'flora_pos_user'
  private readonly STORE_KEY = 'flora_pos_store'
  private readonly TERMINAL_KEY = 'flora_pos_terminal'

  // Real authentication via API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Authentication failed')
    }

    const data = await response.json()

    // Transform API response to match expected format
    const loginResponse: LoginResponse = {
      token: data.token || 'authenticated',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      user: {
        id: data.user?.id?.toString() || 'user-1',
        email: data.user?.email || credentials.email,
        firstName: data.user?.display_name?.split(' ')[0] || 'User',
        lastName: data.user?.display_name?.split(' ').slice(1).join(' ') || '',
        role: UserRole.STORE_ADMIN,
        storeId: credentials.storeId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      store: {
        id: credentials.storeId,
        name: data.store?.name || 'Store',
        address: data.store?.slug || '',
        phone: '',
        isActive: true,
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 0.06,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      terminal: {
        id: credentials.terminalId,
        name: data.terminal?.name || 'Terminal',
        storeId: credentials.storeId,
        isActive: true,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    // Store in encrypted storage
    this.setToken(loginResponse.token)
    this.setUser(loginResponse.user)
    this.setStore(loginResponse.store)
    this.setTerminal(loginResponse.terminal)

    return loginResponse
  }

  async logout(): Promise<void> {
    // Call logout API
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout API error:', error)
    }

    // Clear encrypted storage
    authStorage.removeToken()
    authStorage.removeUserData()
    
    // Also clear legacy localStorage items for backward compatibility
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
      localStorage.removeItem(this.STORE_KEY)
      localStorage.removeItem(this.TERMINAL_KEY)
    }
  }

  async refreshToken(): Promise<string> {
    // Return existing token for now
    return this.getToken() || 'authenticated'
  }

  // Storage helpers
  getToken(): string | null {
    // Try encrypted storage first, fallback to localStorage for migration
    const encryptedToken = authStorage.getToken()
    if (encryptedToken) return encryptedToken
    
    // Fallback for migration
    if (typeof window !== 'undefined') {
      const legacyToken = localStorage.getItem(this.TOKEN_KEY)
      if (legacyToken) {
        // Migrate to encrypted storage
        authStorage.setToken(legacyToken)
        localStorage.removeItem(this.TOKEN_KEY)
        return legacyToken
      }
    }
    
    return null
  }

  setToken(token: string): void {
    // Store in encrypted storage with 8 hour expiration
    authStorage.setToken(token, 8 * 60 * 60 * 1000)
  }

  getStoredUser(): User | null {
    // Try encrypted storage first
    const userData = authStorage.getUserData()
    if (userData?.user) return userData.user
    
    // Fallback for migration
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY)
      if (userStr) {
        const user = JSON.parse(userStr)
        // Migrate to encrypted storage
        this.setUser(user)
        localStorage.removeItem(this.USER_KEY)
        return user
      }
    }
    
    return null
  }

  setUser(user: User): void {
    const existingData = authStorage.getUserData() || {}
    authStorage.setUserData({ ...existingData, user }, 8 * 60 * 60 * 1000)
  }

  getStoredStore(): Store | null {
    const userData = authStorage.getUserData()
    if (userData?.store) return userData.store
    
    // Fallback for migration
    if (typeof window !== 'undefined') {
      const storeStr = localStorage.getItem(this.STORE_KEY)
      if (storeStr) {
        const store = JSON.parse(storeStr)
        this.setStore(store)
        localStorage.removeItem(this.STORE_KEY)
        return store
      }
    }
    
    return null
  }

  setStore(store: Store): void {
    const existingData = authStorage.getUserData() || {}
    authStorage.setUserData({ ...existingData, store }, 8 * 60 * 60 * 1000)
  }

  getStoredTerminal(): Terminal | null {
    const userData = authStorage.getUserData()
    if (userData?.terminal) return userData.terminal
    
    // Fallback for migration
    if (typeof window !== 'undefined') {
      const terminalStr = localStorage.getItem(this.TERMINAL_KEY)
      if (terminalStr) {
        const terminal = JSON.parse(terminalStr)
        this.setTerminal(terminal)
        localStorage.removeItem(this.TERMINAL_KEY)
        return terminal
      }
    }
    
    return null
  }

  setTerminal(terminal: Terminal): void {
    const existingData = authStorage.getUserData() || {}
    authStorage.setUserData({ ...existingData, terminal }, 8 * 60 * 60 * 1000)
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Permission helpers (basic implementation)
  hasPermission(user: User, permission: { action: string; resource: string }): boolean {
    return true // For now, allow all actions for authenticated users
  }

  canAccessStore(user: User, storeId: string): boolean {
    return user.storeId === storeId // User can only access their assigned store
  }
}

export const authService = new AuthService() 