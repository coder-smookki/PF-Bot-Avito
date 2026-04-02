'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authApi, userApi } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'customer' | 'executor';
  telegramId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; username: string; role: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data } = await userApi.getProfile();
      setUser(data);
    } catch {
      Cookies.remove('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const token = data.accessToken ?? data.token;
    if (!token) throw new Error('No access token in response');
    Cookies.set('token', token, { expires: 7 });
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; username: string; role: string }) => {
    const { data } = await authApi.register(regData);
    const token = data.accessToken ?? data.token;
    if (!token) throw new Error('No access token in response');
    Cookies.set('token', token, { expires: 7 });
    setUser(data.user);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
