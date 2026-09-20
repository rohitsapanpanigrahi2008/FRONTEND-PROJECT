import { decodeJwt } from 'jose';
import { env } from '@/config/environment';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { LoginSchema, type LoginInput } from '@/utils/validators';
import type { LoginResponse } from '@/types/api';
import type { SessionUser, TokenPayload } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';

const REFRESH_BUFFER_SEC = 60;

class AuthServiceClass {
  /** Validate credentials client-side, then hand off to the backend. */
  async login(input: LoginInput): Promise<SessionUser> {
    const parsed = LoginSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error('Please provide a valid email and a password of at least 8 characters.');
    }

    if (env.useMockApi) {
      return mockLogin(parsed.data);
    }

    const response = await fetch(`${env.apiBaseUrl}${API_ENDPOINTS.auth.login}`, {
      method: 'POST',
      credentials: 'include', // httpOnly refresh cookie
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      // Backend returns 401/429; we never surface its raw error text.
      throw new Error('Sign-in failed. Check your credentials and try again.');
    }

    const payload = (await response.json()) as LoginResponse;
    const user: SessionUser = {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      role: payload.user.role,
      facilityIds: payload.user.facilityIds,
    };
    useAuthStore.getState().setSession(user, payload.accessToken, payload.expiresInSec);
    return user;
  }

  /** True when the access token is missing or expires within the buffer. */
  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const decoded = decodeJwt<TokenPayload>(token);
      return decoded.exp < Math.floor(Date.now() / 1000) + REFRESH_BUFFER_SEC;
    } catch {
      return true;
    }
  }

  async refreshToken(): Promise<string> {
    if (env.useMockApi) {
      const token = createMockJwt('demo-user', 3600);
      const store = useAuthStore.getState();
      store.setAccessToken(token);
      if (store.user) store.setSession(store.user, token, 3600);
      return token;
    }

    const response = await fetch(`${env.apiBaseUrl}${API_ENDPOINTS.auth.refresh}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!response.ok) throw new Error('Token refresh failed');

    const payload = (await response.json()) as { accessToken: string; expiresInSec: number };
    const store = useAuthStore.getState();
    store.setAccessToken(payload.accessToken);

    // Refresh the absolute expiry used by the idle-session watcher.
    if (store.user) {
      store.setSession(store.user, payload.accessToken, payload.expiresInSec);
    }
    return payload.accessToken;
  }

  logout(): void {
    // Best-effort server logout to clear the httpOnly cookie.
    void fetch(`${env.apiBaseUrl}${API_ENDPOINTS.auth.logout}`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);

    useAuthStore.getState().clearSession();
    window.location.assign('/login');
  }
}

export const AuthService = new AuthServiceClass();

/* ---------------- Mock-mode session helpers (no network) ---------------- */

function base64UrlEncode(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Unsigned demo JWT — decodeJwt only reads the payload; no verification needed offline. */
function createMockJwt(sub: string, expiresInSec: number): string {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub, role: 'admin', exp: now + expiresInSec, iat: now };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock-signature`;
}

function mockLogin(input: LoginInput): SessionUser {
  const role = input.email.startsWith('admin')
    ? 'admin'
    : input.email.startsWith('operator')
      ? 'operator'
      : 'analyst';
  const token = createMockJwt(input.email, 3600);
  const user: SessionUser = {
    id: `mock-${role}`,
    name: role.charAt(0).toUpperCase() + role.slice(1),
    email: input.email,
    role,
    facilityIds: ['facility-demo-01'],
  };
  useAuthStore.getState().setSession(user, token, 3600);
  return user;
}
