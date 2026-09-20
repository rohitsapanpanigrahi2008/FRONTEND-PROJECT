import { create } from 'zustand';
import type { SessionUser } from '@/types/auth';

interface AuthState {
  user: SessionUser | null;
  /** Short-lived access JWT. Memory only — never localStorage, never cookies we write. */
  accessToken: string | null;
  sessionExpiresAt: number | null;
  lastActivityAt: number;
  isAuthenticated: boolean;
  setSession: (user: SessionUser, accessToken: string, expiresInSec: number) => void;
  setAccessToken: (token: string) => void;
  touchActivity: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  sessionExpiresAt: null,
  lastActivityAt: Date.now(),
  isAuthenticated: false,
  setSession: (user, accessToken, expiresInSec) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      sessionExpiresAt: Date.now() + expiresInSec * 1000,
      lastActivityAt: Date.now(),
    }),
  setAccessToken: (accessToken) => set({ accessToken }),
  touchActivity: () => set({ lastActivityAt: Date.now() }),
  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      sessionExpiresAt: null,
      isAuthenticated: false,
    }),
}));
