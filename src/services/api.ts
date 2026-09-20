import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/environment';
import { API_TIMEOUT_MS } from '@/config/constants';
import { getErrorMessage } from '@/utils/errorHandlers';
import { useNotificationStore } from '@/store/notificationStore';
import { apiRateLimiter } from '@/utils/rateLimiter';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // httpOnly refresh cookie travels automatically
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------- Request interceptor: security headers + client rate limit ----------------

api.interceptors.request.use((config) => {
  // Client-side throttle — the backend remains the authoritative limiter.
  const verdict = apiRateLimiter.isAllowed('global');
  if (!verdict.allowed && !import.meta.env.DEV) {
    return Promise.reject(
      new axios.AxiosError(
        `Client rate limit reached. Retry after ${verdict.retryAfterSec ?? 60}s`,
        'CLIENT_RATE_LIMIT',
        config,
      ),
    );
  }

  // CSRF token is injected by the server into the HTML shell at runtime.
  const csrfToken = document
    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    ?.getAttribute('content');
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;

  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  config.headers['X-API-Version'] = '1.0';
  return config;
});

// ---------------- Response interceptor: 401 refresh + graceful degradation ----------------

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const { AuthService } = await import('./auth');
        const newToken = await AuthService.refreshToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        const { AuthService } = await import('./auth');
        AuthService.logout();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 429) {
      const retryAfter = Number(error.response.headers['retry-after'] ?? 60);
      useNotificationStore.getState().push('warning', `Too many requests — retrying in ${retryAfter}s`);
      return Promise.reject(error);
    }

    // Never leak internals: collapse all errors to safe, generic messages.
    const sanitized = new Error(getErrorMessage(error));
    return Promise.reject(sanitized);
  },
);

export default api;
