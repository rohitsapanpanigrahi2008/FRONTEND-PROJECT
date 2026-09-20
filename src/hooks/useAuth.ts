import { useCallback, useEffect, useRef } from 'react';
import { AuthService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { SESSION } from '@/config/constants';
import type { LoginInput } from '@/utils/validators';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const login = useCallback(async (input: LoginInput) => AuthService.login(input), []);
  const logout = useCallback(() => AuthService.logout(), []);

  return { user, isAuthenticated, login, logout };
}

/**
 * Idle-session watcher: warns shortly before forced sign-out and signs the
 * user out after the configured idle window. Call once, at the app shell level.
 */
export function useIdleSessionTimeout(onWarn: (minLeft: number) => void): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      warnedRef.current = false;
      return;
    }
    const interval = window.setInterval(() => {
      const idleMin = (Date.now() - useAuthStore.getState().lastActivityAt) / 60000;
      const minutesLeft = SESSION.IDLE_TIMEOUT_MIN - idleMin;
      if (minutesLeft <= 0) {
        AuthService.logout();
      } else if (minutesLeft <= SESSION.WARNING_BEFORE_MIN && !warnedRef.current) {
        warnedRef.current = true;
        onWarn(Math.ceil(minutesLeft));
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, onWarn]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel'];
    const touch = () => useAuthStore.getState().touchActivity();
    events.forEach((evt) => window.addEventListener(evt, touch, { passive: true }));
    return () => events.forEach((evt) => window.removeEventListener(evt, touch));
  }, [isAuthenticated]);
}
