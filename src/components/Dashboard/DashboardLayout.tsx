import { NavLink, Outlet } from 'react-router-dom';
import { Droplets, LayoutDashboard, Settings, Wind, Zap } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { Header, Footer } from './Header';
import { MODULES } from '@/config/constants';

const MOBILE_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/modules/air-quality', label: 'Air', icon: Wind },
  { to: '/modules/energy', label: 'Energy', icon: Zap },
  { to: '/modules/water', label: 'Water', icon: Droplets },
  { to: '/settings', label: 'More', icon: Settings },
];

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="ultra-contained flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 pt-5 sm:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="glass-panel mobile-nav-safe fixed inset-x-0 bottom-0 z-40 flex justify-around rounded-none border-x-0 border-b-0 py-1.5 lg:hidden"
        aria-label="Primary mobile navigation"
      >
        {MOBILE_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                isActive ? 'text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Screen-reader access to the full module list */}
      <span className="sr-only">{MODULES.map((m) => m.name).join(', ')}</span>
    </div>
  );
}
