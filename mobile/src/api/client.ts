import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from '@/auth/tokenStore';
import { getApiUrl } from './config';
import type { AuthResponse } from './types';

export const API_URL = getApiUrl();

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

// Chamado quando já não é possível renovar a sessão (o AuthProvider faz logout)
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Renovação "single flight": vários 401 em simultâneo partilham o mesmo pedido de refresh
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('Sem refresh token');
  // axios "limpo" (sem interceptors) para não entrar em ciclo
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 15_000 });
  await tokenStore.rotate(data.accessToken, data.refreshToken);
  return data.accessToken;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthRoute = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        await tokenStore.clear();
        onAuthFailure?.();
      }
    }
    return Promise.reject(error);
  },
);

/** Mensagem legível a partir de um erro da API (aceita string ou lista de validações). */
export function getErrorMessage(error: unknown, fallback = 'Algo correu mal. Tente novamente.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Sem ligação ao servidor. Verifique a internet e o endereço da API.';
    const msg = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(msg)) return msg.join('\n');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
