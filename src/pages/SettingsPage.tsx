import { useSettingsStore } from '@/store/settingsStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { env } from '@/config/environment';

export default function SettingsPage() {
  const { theme, density, reduceMotion, setTheme, setDensity, setReduceMotion } = useSettingsStore();
  const liveEnabled = useDashboardStore((s) => s.liveEnabled);
  const toggleLive = useDashboardStore((s) => s.toggleLive);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      <section className="glass-card space-y-4 p-6" aria-label="Appearance">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Theme</span>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${
                  theme === t ? 'bg-sky-500 text-night-950' : 'glass-input text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Density</span>
          <div className="flex gap-2">
            {(['comfortable', 'compact'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${
                  density === d ? 'bg-sky-500 text-night-950' : 'glass-input text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Reduce motion</span>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
            className="h-5 w-5 accent-sky-500"
          />
        </label>
      </section>

      <section className="glass-card space-y-4 p-6" aria-label="Data source">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Data source</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Live updates</span>
          <button
            type="button"
            onClick={toggleLive}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              liveEnabled ? 'bg-emerald-500 text-night-950' : 'glass-input text-slate-300'
            }`}
          >
            {liveEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          API base: <code className="text-slate-400">{env.apiBaseUrl}</code> · mock mode:{' '}
          <span className={env.useMockApi ? 'text-amber-300' : 'text-emerald-300'}>
            {String(env.useMockApi)}
          </span>
        </p>
        <p className="text-xs text-slate-500">
          Build v{env.appVersion} · Session tokens live in memory + httpOnly cookies only.
        </p>
      </section>

      <section className="glass-card p-6 text-xs leading-relaxed text-slate-400">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-400">
          About this dashboard
        </h2>
        <p>
          All figures are synthetic demonstration data produced by the built-in mock API. Forecasts
          and recommendations are decision-support outputs with stated assumptions — they are not
          official measurements and should be validated on site before operational action.
        </p>
      </section>
    </div>
  );
}
