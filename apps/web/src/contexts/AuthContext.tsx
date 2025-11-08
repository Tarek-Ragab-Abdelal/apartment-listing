'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authApi, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'USER' | 'AGENT';
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
       if (globalThis.window === undefined) return;
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        // Verify token with the server
        const response = await authApi.me();
        if (response.success) {
          setUser(response.data);
        } else {
          // Invalid token, clear it
          clearTokens();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        
        // Store token based on rememberMe preference
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', response.data.token);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'USER' | 'AGENT';
  }): Promise<boolean> => {
    try {
      const response = await authApi.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        
        // Store token in localStorage by default for new registrations
        localStorage.setItem('authToken', response.data.token);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch((error) => {
      console.error('Logout API call failed:', error);
    });
    setUser(null);
    clearTokens();
  };

  const contextValue = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isLoading,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
