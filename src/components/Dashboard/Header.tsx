import { useEffect, useRef, useState } from 'react';
import { LogOut, Radio, RadioTower, User } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/config/constants';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/Common/ThemeToggle';
import { LocationSelector } from '@/components/Dashboard/LocationSelector';
import { formatTime } from '@/utils/formatters';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const liveEnabled = useDashboardStore((s) => s.liveEnabled);
  const toggleLive = useDashboardStore((s) => s.toggleLive);
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-40 flex items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400 text-sm font-black text-night-950">
          FI
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-bold text-white sm:text-base">
          {APP_NAME} <span className="hidden font-normal text-slate-400 sm:inline">· {APP_TAGLINE}</span>
        </h1>
      </div>

      <LocationSelector />

      <button
        type="button"
        onClick={toggleLive}
        className={`glass-input flex items-center gap-2 px-3 py-2 text-xs font-semibold ${
          liveEnabled ? 'text-emerald-300' : 'text-slate-400'
        }`}
        aria-pressed={liveEnabled}
        aria-label="Toggle live data updates"
      >
        {liveEnabled ? <Radio className="h-4 w-4 text-emerald-400" /> : <RadioTower className="h-4 w-4" />}
        <span className="hidden sm:inline">{liveEnabled ? 'LIVE' : 'PAUSED'}</span>
      </button>

      <ThemeToggle />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="glass-input flex h-10 w-10 items-center justify-center text-slate-300 hover:text-white"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="User menu"
        >
          <User className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="glass-panel absolute right-0 top-12 w-56 p-3 shadow-glass" role="menu">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Guest'}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-300">
              {user?.role}
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-400/10"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 px-4 pb-24 pt-2 text-center text-[11px] text-slate-500 lg:pb-6">
      <p>
        Data shown is synthetic demo data. Outputs are decision-support insights, not official
        measurements. · {formatTime(new Date().toISOString())}
      </p>
    </footer>
  );
}
