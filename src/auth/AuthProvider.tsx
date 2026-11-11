import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthFailureHandler } from '@/api/client';
import type { AuthResponse, AuthUser } from '@/api/types';
import { tokenStore } from './tokenStore';

interface AuthContextValue {
  user: AuthUser | null;
  updateUser: (user: Partial<AuthUser>) => void;
  /** false enquanto se verifica se já existe uma sessão guardada */
  ready: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(async () => {
    await tokenStore.clear();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  // Restaurar sessão ao abrir a app
  useEffect(() => {
    (async () => {
      try {
        await tokenStore.load();
        if (tokenStore.getRefresh()) {
          const { data } = await api.get<AuthUser>('/users/me'); // o interceptor renova o token se preciso
          setUser(data);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Se a renovação falhar em qualquer pedido, volta ao ecrã de entrada
  useEffect(() => {
    setAuthFailureHandler(() => {
      queryClient.clear();
      setUser(null);
    });
    return () => setAuthFailureHandler(null);
  }, [queryClient]);

  const startSession = useCallback(async (data: AuthResponse, remember: boolean) => {
    await tokenStore.save(data.accessToken, data.refreshToken, remember);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { email: email.trim(), password });
      await startSession(data, remember);
    },
    [startSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, remember: boolean) => {
      const { data } = await api.post<AuthResponse>('/auth/register', { name: name.trim(), email: email.trim(), password });
      await startSession(data, remember);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* sem ligação: termina a sessão localmente na mesma */
    }
    await clearSession();
  }, [clearSession]);

  const updateUser = useCallback((updated: Partial<AuthUser>) => {
    setUser((current) => current ? { ...current, ...updated } : current);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout, updateUser }), [user, ready, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de <AuthProvider>');
  return ctx;
}
