/**
 * Secure Storage Utilities
 * Provides encrypted local storage for sensitive data
 */

import CryptoJS from 'crypto-js'

interface StorageConfig {
  encryptionKey?: string
  storagePrefix?: string
  expirationTime?: number // in milliseconds
}

interface StoredData {
  data: any
  timestamp: number
  expiresAt?: number
}

class SecureStorage {
  private encryptionKey: string
  private storagePrefix: string
  private defaultExpiration: number

  constructor(config: StorageConfig = {}) {
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey()
    this.storagePrefix = config.storagePrefix || 'flora_secure_'
    this.defaultExpiration = config.expirationTime || 24 * 60 * 60 * 1000 // 24 hours
  }

  /**
   * Generate a secure encryption key based on device/session info
   */
  private generateEncryptionKey(): string {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36)
    
    // Create a device-specific key
    const deviceFingerprint = CryptoJS.SHA256(userAgent + timestamp + random).toString()
    
    // Use environment variable if available, otherwise use device fingerprint
    const baseKey = process.env.NEXT_PUBLIC_STORAGE_KEY || deviceFingerprint
    
    return CryptoJS.SHA256(baseKey).toString()
  }

  /**
   * Encrypt data using AES encryption
   */
  private encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data)
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString()
      return encrypted
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt data using AES decryption
   */
  private decrypt(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey)
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!jsonString) {
        throw new Error('Decryption resulted in empty string')
      }
      
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Store encrypted data in localStorage
   */
  setItem(key: string, value: any, expirationTime?: number): boolean {
    if (typeof window === 'undefined') {
      console.warn('SecureStorage: localStorage not available on server')
      return false
    }

    try {
      const now = Date.now()
      const expiresAt = expirationTime ? now + expirationTime : now + this.defaultExpiration
      
      const storedData: StoredData = {
        data: value,
        timestamp: now,
        expiresAt
      }

      const encryptedData = this.encrypt(storedData)
      const storageKey = this.storagePrefix + key

      localStorage.setItem(storageKey, encryptedData)
      
      return true
    } catch (error) {
      console.error('Failed to store encrypted data:', error)
      return false
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  getItem<T = any>(key: string): T | null {
    if (typeof window === 'undefined') {
      console.warn('SecureStorage: localStorage not available on server')
      return null
    }

    try {
      const storageKey = this.storagePrefix + key
      const encryptedData = localStorage.getItem(storageKey)
      
      if (!encryptedData) {
        return null
      }

      const storedData: StoredData = this.decrypt(encryptedData)
      
      // Check if data has expired
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        this.removeItem(key)
        return null
      }

      return storedData.data as T
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error)
      // Remove corrupted data
      this.removeItem(key)
      return null
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storageKey = this.storagePrefix + key
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to clear secure storage:', error)
    }
  }

  /**
   * Get all keys in secure storage
   */
  getAllKeys(): string[] {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const keys = Object.keys(localStorage)
      return keys
        .filter(key => key.startsWith(this.storagePrefix))
        .map(key => key.replace(this.storagePrefix, ''))
    } catch (error) {
      console.error('Failed to get keys:', error)
      return []
    }
  }

  /**
   * Check if an item exists and is not expired
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null
  }

  /**
   * Update expiration time for an existing item
   */
  updateExpiration(key: string, expirationTime: number): boolean {
    const data = this.getItem(key)
    if (data === null) {
      return false
    }
    
    return this.setItem(key, data, expirationTime)
  }

  /**
   * Get item metadata (timestamp, expiration)
   */
  getItemMetadata(key: string): { timestamp: number; expiresAt?: number } | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const storageKey = this.storagePrefix + key
      const encryptedData = localStorage.getItem(storageKey)
      
      if (!encryptedData) {
        return null
      }

      const storedData: StoredData = this.decrypt(encryptedData)
      
      return {
        timestamp: storedData.timestamp,
        expiresAt: storedData.expiresAt
      }
    } catch (error) {
      console.error('Failed to get metadata:', error)
      return null
    }
  }

  /**
   * Clean up expired items
   */
  cleanupExpired(): number {
    if (typeof window === 'undefined') {
      return 0
    }

    let cleaned = 0
    const keys = this.getAllKeys()
    
    keys.forEach(key => {
      const metadata = this.getItemMetadata(key)
      if (metadata && metadata.expiresAt && Date.now() > metadata.expiresAt) {
        this.removeItem(key)
        cleaned++
      }
    })

    return cleaned
  }
}

// Create default instance
export const secureStorage = new SecureStorage()

// Export class for custom instances
export { SecureStorage }

// Convenience functions for common sensitive data
export const authStorage = {
  setToken: (token: string, expirationTime?: number) => 
    secureStorage.setItem('auth_token', token, expirationTime),
  
  getToken: (): string | null => 
    secureStorage.getItem<string>('auth_token'),
  
  removeToken: () => 
    secureStorage.removeItem('auth_token'),
  
  setUserData: (userData: any, expirationTime?: number) => 
    secureStorage.setItem('user_data', userData, expirationTime),
  
  getUserData: <T = any>(): T | null => 
    secureStorage.getItem<T>('user_data'),
  
  removeUserData: () => 
    secureStorage.removeItem('user_data')
}

export const cartStorage = {
  setCart: (cartData: any, expirationTime?: number) => 
    secureStorage.setItem('cart_data', cartData, expirationTime),
  
  getCart: <T = any>(): T | null => 
    secureStorage.getItem<T>('cart_data'),
  
  removeCart: () => 
    secureStorage.removeItem('cart_data')
}

export const preferencesStorage = {
  setPreferences: (preferences: any, expirationTime?: number) => 
    secureStorage.setItem('user_preferences', preferences, expirationTime),
  
  getPreferences: <T = any>(): T | null => 
    secureStorage.getItem<T>('user_preferences'),
  
  removePreferences: () => 
    secureStorage.removeItem('user_preferences')
}

// Auto cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired items on page load
  setTimeout(() => {
    const cleaned = secureStorage.cleanupExpired()
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired storage items`)
    }
  }, 1000)
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(() => {
    secureStorage.cleanupExpired()
  }, 30 * 60 * 1000)
}