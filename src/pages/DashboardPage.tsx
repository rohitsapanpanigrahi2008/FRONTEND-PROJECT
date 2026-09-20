import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Droplets, Gauge, Wind, Zap } from 'lucide-react';
import { MODULES, aqiBand } from '@/config/constants';
import { useDashboard, useAnomalies, useRecommendations } from '@/hooks/useApi';
import { useDashboardStore } from '@/store/dashboardStore';
import { GaugeChart } from '@/components/Charts/GaugeChart';
import { LineChartModule } from '@/components/Charts/LineChartModule';
import { AnomalyBadge } from '@/components/ModuleCards/AnomalyBadge';
import { RecommendationCard } from '@/components/ModuleCards/RecommendationCard';
import { DetailModal } from '@/components/Modals/DetailModal';
import { SkeletonCard } from '@/components/Common/SkeletonLoader';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import type { Anomaly, Recommendation } from '@/types';
import { formatNumber } from '@/utils/formatters';
import { useLiveAqi, useActiveLocationLabel } from '@/hooks/useLiveAqi';

const FacilityGlobe = lazy(() =>
  import('@/components/3D/FacilityGlobe').then((m) => ({ default: m.FacilityGlobe })),
);

export default function DashboardPage() {
  const facilityId = useDashboardStore((s) => s.facilityId);
  const { data: summary, isLoading } = useDashboard(facilityId);
  const { data: anomalies = [] } = useAnomalies();
  const { data: recommendations = [] } = useRecommendations();
  const [selected, setSelected] = useState<Anomaly | Recommendation | null>(null);
  const { data: liveAqi, status: aqiStatus } = useLiveAqi();
  const locationLabel = useActiveLocationLabel();

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Live location feature: when a city is chosen, AQI-bound UI switches to real
  // data; otherwise everything stays on the synthetic demo feed as before.
  const isLiveAqi = aqiStatus === 'ready' && liveAqi !== null;
  const aqiValue = liveAqi?.aqi ?? summary.aqiNow;
  const band = aqiBand(aqiValue);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">
            {summary.facility.type} · {summary.facility.city}, {summary.facility.state}
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{summary.facility.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Composite facility health and live sustainability posture across 8 modules.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-10 h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]">
          <ErrorBoundary
            fallback={
              <div className="flex h-full items-center justify-center text-4xl opacity-40">🌐</div>
            }
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center opacity-40">
                  <LoadingSpinner />
                </div>
              }
            >
              <FacilityGlobe healthScore={summary.healthScore} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key metrics">
        <KpiCard icon={<Gauge className="h-4 w-4" />} label="Facility health" value={`${summary.healthScore}/100`} accent="#38bdf8" />
        <KpiCard
          icon={<Wind className="h-4 w-4" />}
          label="AQI now"
          value={`${aqiValue} · ${band.label}`}
          sub={isLiveAqi ? `LIVE · ${locationLabel ?? ''}` : 'demo data'}
          accent={band.color}
        />
        <KpiCard icon={<Zap className="h-4 w-4" />} label="Energy today" value={`${formatNumber(summary.energyTodayKwh)} kWh`} accent="#fbbf24" />
        <KpiCard icon={<Droplets className="h-4 w-4" />} label="Water today" value={`${formatNumber(summary.waterTodayL)} L`} accent="#2dd4bf" />
      </section>

      {/* Live pollutant strip — only rendered when a real location is selected */}
      {isLiveAqi && liveAqi && (
        <section
          className="glass-card flex flex-wrap items-center gap-2 p-3"
          aria-label="Live pollutant readings for selected location"
        >
          <span
            className="mr-1 text-[10px] font-black uppercase tracking-widest"
            style={{ color: band.color }}
          >
            ● Live · {locationLabel}
          </span>
          {liveAqi.pollutants.map((p) => (
            <span
              key={p.key}
              className="glass-input px-2.5 py-1 text-[11px] text-slate-300"
              title={`${p.label} concentration`}
            >
              <span className="font-semibold text-white">{p.label}</span> {p.value.toFixed(1)} {p.unit}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-slate-500">
            Dominant: {liveAqi.dominantPollutant} · updated{' '}
            {new Date(liveAqi.updatedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Module grid + trend */}
        <div className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Modules</h2>
          <div className="stagger-container grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link
                  to={`/modules/${m.id}`}
                  className="glass-card group block p-5"
                  style={{ borderLeft: `3px solid ${m.accent}` }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-300" />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{m.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          <TrendStrip />
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <section className="glass-card flex items-center justify-around p-5" aria-label="Scores">
            <GaugeChart value={summary.sustainabilityScore} label="Sustainability" size={130} />
            <GaugeChart value={summary.safetyScore} label="Safety" size={130} invertColor />
          </section>

          <section aria-label="Active anomalies">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Activity className="h-4 w-4 text-rose-400" /> Active anomalies ({anomalies.length})
            </h2>
            <div className="space-y-2.5">
              {anomalies.slice(0, 4).map((a) => (
                <AnomalyBadge key={a.id} anomaly={a} onClick={setSelected} />
              ))}
            </div>
          </section>

          <section aria-label="Recommendations">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">
              Top recommendations
            </h2>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((r) => (
                <RecommendationCard key={r.id} recommendation={r} onOpen={setSelected} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <DetailModal
        open={selected !== null}
        title={selected && 'title' in selected ? selected.title : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            {'description' in selected && <p className="text-slate-300">{selected.description}</p>}
            {'detail' in selected && <p className="text-slate-300">{selected.detail}</p>}
            {'impact' in selected && (
              <p className="font-medium text-emerald-300">Expected impact: {selected.impact}</p>
            )}
            {'confidence' in selected && (
              <p className="text-xs text-slate-400">
                Model confidence: {(selected.confidence * 100).toFixed(0)}%
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Decision-support insight — validate with on-site teams before action.
            </p>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="glass-card p-4" style={{ borderTop: `2px solid ${accent}` }}>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <p className="mt-1.5 text-xl font-bold text-white">{value}</p>
      {sub && (
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {sub}
        </p>
      )}
    </div>
  );
}

/** Small strip proving charts render with the shared synthetic feed. */
function TrendStrip() {
  const points = Array.from({ length: 24 }, (_, h) => ({
    t: new Date(Date.now() - (23 - h) * 36e5).toISOString(),
    value: 60 + Math.sin(h / 3.4) * 22 + h * 0.4,
  }));
  return (
    <section className="glass-card mt-6 p-5" aria-label="Facility load trend">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Facility load · 24 h</h3>
        <span className="text-xs text-slate-400">synthetic feed</span>
      </div>
      <LineChartModule points={points} color="#38bdf8" unit="kW" height={170} />
    </section>
  );
}
