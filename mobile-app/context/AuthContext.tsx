import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';

import { API_BASE_URL, api } from '@/constants/api';

const TOKEN_KEY = '@agrifusion_token';
const REQUEST_TIMEOUT_MS = 10000;

function connectivityErrorMessage(): string {
  return (
    'Could not reach server. Check: 1) Backend running (npm start in backend folder) 2) Correct IP in mobile-app/.env (run ipconfig for your IP) 3) Phone and PC on same WiFi 4) Firewall allows port 5000'
  );
}

function isUnreachableError(e: unknown): boolean {
  if (!axios.isAxiosError(e)) {
    const msg = e instanceof Error ? e.message : '';
    return msg === 'Network request timed out';
  }
  const err = e as AxiosError;
  if (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout')) return true;
  if (!err.response) return true;
  return false;
}

const USER_KEY = '@agrifusion_user';

export interface AuthUser {
  id: string;
  name: string;
  district?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string, district: string) => Promise<void>;
  logout: () => Promise<void>;
}

function isAuthUser(v: unknown): v is AuthUser {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as AuthUser).id === 'string' &&
    typeof (v as AuthUser).name === 'string'
  );
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const clearStoredAuth = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]).catch(() => {});
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      const [fromTokenKey, fromToken, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem(USER_KEY),
      ]);
      const storedToken = fromTokenKey || fromToken;
      if (!storedToken || !userJson) {
        console.log('[Auth] No token in AsyncStorage → show login');
        setIsLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(userJson) as unknown;
        if (!isAuthUser(parsed)) throw new Error('Invalid user');
        const res = await api.get('/api/dashboard', {
          headers: { Authorization: `Bearer ${storedToken}` },
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: (s) => s < 500,
        });
        if (res.status !== 200) {
          console.log('[Auth] Token validation failed (401/403) → clear and show login');
          await clearStoredAuth();
          setIsLoading(false);
          return;
        }
        setToken(storedToken);
        setUser(parsed);
        console.log('[Auth] Token validated → show dashboard');
      } catch {
        await clearStoredAuth();
        console.log('[Auth] Invalid token/user data → show login');
      }
    } catch (e) {
      console.warn('[Auth] loadAuth error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [clearStoredAuth]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  const persistAuth = useCallback(async (t: string, u: AuthUser) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('token', t),
        AsyncStorage.setItem(TOKEN_KEY, t),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
      ]);
    } catch {
      // Storage failed - still update state
    }
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
      console.log('Resolved base URL:', api.defaults.baseURL);
      try {
        const { data } = await api.post<{ token?: string; user?: AuthUser; message?: string }>(
          '/api/auth/login',
          { phone, password },
          { timeout: REQUEST_TIMEOUT_MS }
        );
        const t = data.token;
        const u = data.user;
        if (!t || !u) throw new Error('Invalid login response');
        await persistAuth(t, u);
      } catch (e) {
        if (isUnreachableError(e)) {
          throw new Error(connectivityErrorMessage());
        }
        if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
          const msg = (e.response.data as { message?: string }).message;
          console.log('Login failed:', e.response.data);
          throw new Error(msg || 'Login failed');
        }
        throw e instanceof Error ? e : new Error('Login failed');
      }
    },
    [persistAuth]
  );

  const register = useCallback(
    async (name: string, phone: string, password: string, district: string) => {
      if (!password || password.trim() === '') {
        throw new Error('Password is required');
      }
      const body = { name, phone, password, district };
      const url = `${API_BASE_URL}/api/auth/register`;
      console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
      console.log('Resolved base URL:', api.defaults.baseURL);
      console.log('[REGISTER] Full API URL:', url);
      console.log('[REGISTER] Payload:', { ...body, password: '[REDACTED]' });
      try {
        const { data } = await api.post<{ token?: string; user?: AuthUser; message?: string }>(
          '/api/auth/register',
          body,
          { timeout: REQUEST_TIMEOUT_MS }
        );
        const t = data.token;
        const u = data.user;
        if (!t || !u) throw new Error('Invalid registration response');
        await persistAuth(t, u);
      } catch (error) {
        if (isUnreachableError(error)) {
          throw new Error(connectivityErrorMessage());
        }
        if (axios.isAxiosError(error) && error.response?.data) {
          const d = error.response.data as { message?: string };
          console.log('REGISTER ERROR:', error.response.data);
          console.log('STATUS:', error.response.status);
          throw new Error(d.message || 'Registration failed');
        }
        const msg = error instanceof Error ? error.message : 'Registration failed';
        throw new Error(msg);
      }
    },
    [persistAuth]
  );

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      console.log('[Auth] Token removed from AsyncStorage');
    } catch (e) {
      console.warn('[Auth] AsyncStorage remove failed:', e);
    }
    setToken(null);
    setUser(null);
    console.log('[Auth] User state cleared');
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
