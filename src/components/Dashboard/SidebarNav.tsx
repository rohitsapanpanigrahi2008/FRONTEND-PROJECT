import { NavLink } from 'react-router-dom';
import {
  Car,
  Cpu,
  Droplets,
  LayoutDashboard,
  Leaf,
  Recycle,
  Settings,
  ShieldAlert,
  Wind,
  Zap,
} from 'lucide-react';
import { MODULES } from '@/config/constants';
import { useAuthStore } from '@/store/authStore';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind,
  Recycle,
  Zap,
  Droplets,
  Car,
  Cpu,
  ShieldAlert,
  Leaf,
};

export function SidebarNav() {
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col rounded-none border-y-0 border-l-0 p-4 lg:flex"
      aria-label="Primary navigation"
    >
      <nav className="flex flex-1 flex-col gap-1" aria-label="Modules">
        <NavItem to="/" icon={<LayoutDashboard className="h-4.5 w-4.5" />} label="Overview" end />
        <p className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Modules
        </p>
        {MODULES.map((m) => {
          const Icon = ICONS[m.icon] ?? Cpu;
          return (
            <NavItem
              key={m.id}
              to={`/modules/${m.id}`}
              icon={<Icon className="h-4.5 w-4.5" />}
              label={m.short}
              dotColor={m.accent}
            />
          );
        })}
        <p className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          System
        </p>
        <NavItem to="/settings" icon={<Settings className="h-4.5 w-4.5" />} label="Settings" />
        {user?.role === 'admin' && (
          <li className="px-3 pt-2 text-[10px] text-slate-500">Admin tools: backend-gated</li>
        )}
      </nav>
      <p className="px-3 text-[10px] leading-relaxed text-slate-600">
        Decision-support insights only — not official measurements.
      </p>
    </aside>
  );
}

function NavItem({
  to,
  icon,
  label,
  dotColor,
  end = false,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  dotColor?: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-sky-400/10 text-sky-300'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
        }`
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
    </NavLink>
  );
}
