'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api-fetch';
import { useRouter } from 'next/navigation';
import { checkUserLocation } from '../utils/checkUserLocation';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  location?: string;
  location_id?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserLocation?: (locationId: string, locationName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth data on mount - only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('pos_user');
      const storedToken = localStorage.getItem('pos_token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Apply dev location override if it exists (dev mode only)
          const devOverride = localStorage.getItem('dev_location_override');
          if (devOverride) {
            try {
              const override = JSON.parse(devOverride);
              userData.location_id = override.id;
              userData.location = override.name;
            } catch (e) {
              console.error('Failed to parse dev location override:', e);
            }
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('pos_user');
          localStorage.removeItem('pos_token');
        }
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const credentials = btoa(`${username}:${password}`);
      
      // Step 1: Authenticate with WordPress
      // Use dedicated auth endpoint that validates credentials
      console.log('🔐 Authenticating with WordPress...');
      const wpResponse = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!wpResponse.ok) {
        console.error('❌ WordPress authentication failed:', wpResponse.status);
        return false;
      }

      const loginResult = await wpResponse.json();
      
      if (!loginResult.success || !loginResult.user) {
        console.error('❌ Login failed:', loginResult.error);
        return false;
      }
      
      const wpUser = loginResult.user;
      console.log('✅ WordPress user authenticated:', wpUser.username);

      // Check for dev location override (only in dev mode)
      if (typeof window !== 'undefined') {
        const devOverride = localStorage.getItem('dev_location_override');
        if (devOverride) {
          try {
            const override = JSON.parse(devOverride);
            wpUser.location_id = override.id;
            wpUser.location = override.name;
          } catch (e) {
            console.error('Failed to parse dev location override:', e);
          }
        }
      }

      // User object already comes from login endpoint with location data
      console.log('✅ Final user data:', wpUser);

      setUser(wpUser);
      setIsAuthenticated(true);
      
      return true;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_token');
    }
    router.push('/login');
  };
  
  const updateUserLocation = (locationId: string, locationName: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      location_id: locationId,
      location: locationName
    };
    
    setUser(updatedUser);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_user', JSON.stringify(updatedUser));
      localStorage.setItem('dev_location_override', JSON.stringify({
        id: locationId,
        name: locationName
      }));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUserLocation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}