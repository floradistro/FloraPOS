'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
      console.log('🔐 Authenticating with WordPress...');
      const wpResponse = await fetch('https://api.floradistro.com/wp-json/wp/v2/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!wpResponse.ok) {
        console.error('❌ WordPress authentication failed:', wpResponse.status);
        return false;
      }

      const wpUser = await wpResponse.json();
      console.log('✅ WordPress user authenticated:', wpUser.name);

      // Step 2: Get user's location assignment using WordPress user credentials
      console.log('📍 Checking location assignment for user ID:', wpUser.id);
      let locationName = 'FloraDistro';
      let locationId = null;
      
      try {
        // Use WordPress user credentials to access Flora IM API
        const employeeResponse = await fetch(`https://api.floradistro.com/wp-json/flora-im/v1/employees?user_id=${wpUser.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`, // Use WordPress user credentials
            'Content-Type': 'application/json',
          },
        });

        console.log('🏢 Flora IM Employee API Status:', employeeResponse.status);
        
        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          console.log('✅ Employee data received:', employeeData);
          
          if (employeeData.success && employeeData.employees && employeeData.employees.length > 0) {
            // Find primary location or first active location
            const primaryEmployee = employeeData.employees.find((emp: any) => emp.is_primary === '1' || emp.is_primary === 1);
            const activeEmployee = employeeData.employees.find((emp: any) => emp.status === 'active');
            const assignment = primaryEmployee || activeEmployee || employeeData.employees[0];
            
            if (assignment) {
              locationName = assignment.location_name || `Location ${assignment.location_id}`;
              locationId = assignment.location_id;
              console.log('🎯 Location assignment found:', locationName, 'ID:', locationId);
            }
          } else {
            console.log('❌ No employee assignments found in response:', employeeData);
          }
        } else {
          const errorText = await employeeResponse.text();
          console.log('❌ Flora IM API Error:', employeeResponse.status, errorText);
          console.log('📝 This might mean the user is not assigned to any location in Magic2');
        }
      } catch (error) {
        console.error('❌ Error fetching location assignment:', error);
      }

      // Step 3: Create user object with location
      const userData: User = {
        id: wpUser.id.toString(),
        username: wpUser.username || wpUser.name,
        email: wpUser.email,
        role: wpUser.roles?.[0] || 'user',
        location: locationName,
        location_id: locationId?.toString() || null
      };

      console.log('✅ Final user data:', userData);

      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_user', JSON.stringify(userData));
        localStorage.setItem('pos_token', credentials);
      }
      
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

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
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