import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MODULES } from '@/config/constants';
import { useModuleData } from '@/hooks/useApi';
import { MetricCard } from '@/components/ModuleCards/MetricCard';
import { ForecastPanel } from '@/components/ModuleCards/ForecastPanel';
import { LineChartModule } from '@/components/Charts/LineChartModule';
import { BarChartModule } from '@/components/Charts/BarChartModule';
import { GaugeChart } from '@/components/Charts/GaugeChart';
import { HeatmapChart, type HeatCell } from '@/components/Charts/HeatmapChart';
import { SkeletonCard } from '@/components/Common/SkeletonLoader';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { AirQualityViz } from '@/components/3D/AirQualityViz';
import { EnergyFlowViz } from '@/components/3D/EnergyFlowViz';
import { WasteManagementViz } from '@/components/3D/WasteManagementViz';
import { ModuleViz3D } from '@/components/3D/ModuleViz3D';
import type {
  AirQualityData,
  AssetData,
  EnergyData,
  SafetySummary,
  SustainabilityData,
  TrafficData,
  WasteData,
  WaterData,
} from '@/types';
import { useLiveAqi } from '@/hooks/useLiveAqi';
import { useLocationStore } from '@/store/locationStore';
import type { LiveAqi } from '@/types/location';
import { formatEta, formatNumber, formatPct } from '@/utils/formatters';

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const meta = MODULES.find((m) => m.id === moduleId);
  const { data, isLoading, isError } = useModuleData((moduleId ?? '') as never);

  // Live-location feature (hooks stay above any early return): only the
  // air-quality module reacts to the selected city; every other module keeps
  // the existing synthetic feed untouched.
  const { data: liveAqi, status: aqiStatus } = useLiveAqi();
  const selectedCity = useLocationStore((s) => s.selectedCity);
  const isAirQuality = meta?.id === 'air-quality';
  const live = isAirQuality && aqiStatus === 'ready' && liveAqi !== null ? liveAqi : null;
  const liveLabel = selectedCity
    ? selectedCity.admin1
      ? `${selectedCity.name}, ${selectedCity.admin1}`
      : `${selectedCity.name}, ${selectedCity.country}`
    : null;

  if (!meta) {
    return (
      <div className="glass-panel p-8 text-center">
        <h1 className="text-xl font-bold text-white">Unknown module</h1>
        <Link to="/" className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300">
          ← Back to overview
        </Link>
      </div>
    );
  }

  if (isLoading || !data) return <SkeletonCard lines={5} />;
  if (isError) {
    return <div className="glass-card p-6 text-sm text-slate-300">Module data unavailable.</div>;
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Overview
        </Link>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{meta.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{meta.description}</p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: `${meta.accent}1f`, color: meta.accent }}
        >
          Updated {new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </header>

      <ErrorBoundary>
        <div className="glass-panel aurora relative h-[300px] overflow-hidden sm:h-[360px]">
          {live && liveLabel && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
              ● Live · {liveLabel}
            </span>
          )}
          <Viz3D moduleId={meta.id} data={data.data} live={live} />
        </div>
      </ErrorBoundary>

      <ModuleBody moduleId={meta.id} data={data.data} live={live} liveLabel={liveLabel} />
      <ForecastPanel moduleId={meta.id} />
    </div>
  );
}

function Viz3D({
  moduleId,
  data,
  live,
}: {
  moduleId: string;
  data: AirQualityData | WasteData | EnergyData | WaterData | TrafficData | AssetData | SafetySummary | SustainabilityData;
  live: LiveAqi | null;
}) {
  switch (moduleId) {
    case 'air-quality': {
      const aq = data as AirQualityData;
      const livePm25 = live?.pollutants.find((p) => p.key === 'pm2_5')?.value;
      const pm25 = livePm25 ?? aq.readings.find((r) => r.id === 'pm25')?.value ?? 50;
      return <AirQualityViz normalizedLevel={Math.min(100, (pm25 / 150) * 100)} />;
    }
    case 'energy': {
      const en = data as EnergyData;
      return <EnergyFlowViz loadPct={Math.min(100, (en.currentKw / 1000) * 100)} />;
    }
    case 'waste': {
      const wa = data as WasteData;
      const maxFill = Math.max(...wa.bins.map((b) => b.fillPct), 0);
      return <WasteManagementViz maxFillPct={maxFill} />;
    }
    default:
      return <NeutralViz moduleId={moduleId} data={data} />;
  }
}

function NeutralViz({ moduleId, data }: { moduleId: string; data: unknown }) {
  const value = neutralValue(moduleId, data);
  return <GenericViz value={value} moduleId={moduleId} />;
}

function neutralValue(moduleId: string, data: unknown): number {
  switch (moduleId) {
    case 'water':
      return Math.min(100, (((data as WaterData).dailyLitres ?? 0) / 600_000) * 100);
    case 'traffic': {
      const t = data as TrafficData;
      return Math.min(100, (t.parking.occupied / Math.max(1, t.parking.total)) * 100);
    }
    case 'assets': {
      const a = data as AssetData;
      const operational = a.assets.filter((x) => x.status === 'operational').length;
      return (operational / Math.max(1, a.assets.length)) * 100;
    }
    case 'safety':
      return (data as SafetySummary).score;
    default:
      return (data as SustainabilityData).score;
  }
}

/** Shared generic 3D panel for modules whose dedicated GLB twin is pending. */
function GenericViz({ value, moduleId }: { value: number; moduleId: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-8 p-6">
      <div className="h-full min-h-[240px] flex-1">
        <ModuleViz3D moduleId="sustainability" dataValue={value} />
      </div>
      <div className="max-w-[240px]">
        <h3 className="text-lg font-bold text-white">
          {value.toFixed(0)}
          <span className="text-sm font-medium text-slate-400"> /100 index</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Live 3D twin bound to {moduleId} telemetry. Rotate to inspect; colours track the
          normalised value from green (good) to red (attention).
        </p>
      </div>
    </div>
  );
}

/* ---------------- Per-module data panels ---------------- */

function ModuleBody({
  moduleId,
  data,
  live,
  liveLabel,
}: {
  moduleId: string;
  data: unknown;
  live: LiveAqi | null;
  liveLabel: string | null;
}) {
  switch (moduleId) {
    case 'air-quality':
      return <AirQualityBody data={data as AirQualityData} live={live} liveLabel={liveLabel} />;
    case 'waste':
      return <WasteBody data={data as WasteData} />;
    case 'energy':
      return <EnergyBody data={data as EnergyData} />;
    case 'water':
      return <WaterBody data={data as WaterData} />;
    case 'traffic':
      return <TrafficBody data={data as TrafficData} />;
    case 'assets':
      return <AssetsBody data={data as AssetData} />;
    case 'safety':
      return <SafetyBody data={data as SafetySummary} />;
    default:
      return <SustainabilityBody data={data as SustainabilityData} />;
  }
}

function AirQualityBody({
  data,
  live,
  liveLabel,
}: {
  data: AirQualityData;
  live: LiveAqi | null;
  liveLabel: string | null;
}) {
  // Override PM2.5 / PM10 with live concentrations for the chosen city;
  // CO₂ and VOC stay on the synthetic feed (no live source for those).
  const readings = live
    ? data.readings.map((r) => {
        if (r.id === 'pm25') {
          const v = live.pollutants.find((p) => p.key === 'pm2_5')?.value;
          return v !== undefined ? { ...r, value: v, trendPct: 0 } : r;
        }
        if (r.id === 'pm10') {
          const v = live.pollutants.find((p) => p.key === 'pm10')?.value;
          return v !== undefined ? { ...r, value: v, trendPct: 0 } : r;
        }
        return r;
      })
    : data.readings;
  const aq: AirQualityData = live
    ? {
        ...data,
        readings,
        aqi: live.aqi,
        dominantPollutant: live.dominantPollutant,
      }
    : data;

  const cells = useMemo<HeatCell[]>(
    () =>
      aq.zonePm25.flatMap((z) =>
        Array.from({ length: 8 }, (_, i) => ({
          zone: z.zone,
          hour: i * 3,
          value: Math.max(5, Math.min(100, z.pm25 + Math.sin(i / 2 + z.pm25) * 18)),
        })),
      ),
    [aq.zonePm25],
  );

  return (
    <>
      {live && liveLabel && (
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
          ● Live readings · {liveLabel} · via Open-Meteo
        </p>
      )}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {aq.readings.map((r, i) => (
          <MetricCard key={r.id} metric={r} index={i} />
        ))}
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">PM2.5 by zone × hour</h3>
        <HeatmapChart cells={cells} zones={aq.zonePm25.map((z) => z.zone)} unitLabel="PM2.5" />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">PM2.5 · 7-day trend</h3>
        <LineChartModule
          points={aq.readings[0].history}
          color="#38bdf8"
          unit="µg/m³"
          height={220}
        />
      </section>
    </>
  );
}

function WasteBody({ data }: { data: WasteData }) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Bin fill levels by zone</h3>
          <BarChartModule
            data={data.bins.map((b) => ({ label: b.zone, value: b.fillPct }))}
            unit="% full"
          />
          <ul className="mt-4 space-y-2 text-xs">
            {data.bins
              .filter((b) => b.overflowEtaHours !== null)
              .map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg bg-amber-300/10 px-3 py-2">
                  <span className="font-semibold text-amber-200">{b.zone}</span>
                  <span className="text-slate-300">
                    overflow predicted in {formatEta(b.overflowEtaHours)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Waste composition</h3>
          <BarChartModule
            data={data.composition.map((c) => ({ label: c.category, value: c.pct }))}
            unit="%"
            warnRatio={0.4}
            criticalRatio={0.45}
          />
          <p className="mt-4 text-xs text-slate-400">
            Diverted from landfill: <span className="font-bold text-emerald-300">{formatPct(data.divertedPct)}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">Next optimised route: {data.nextRouteOptimisation}</p>
        </div>
      </section>
    </>
  );
}

function EnergyBody({ data }: { data: EnergyData }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Current load" value={`${formatNumber(data.currentKw)} kW`} accent="#fbbf24" />
        <StatTile label="Baseline" value={`${formatNumber(data.baselineKw)} kW`} accent="#94a3b8" />
        <StatTile label="Peak forecast" value={`${formatNumber(data.peakForecastKw)} kW`} accent="#fb923c" />
        <StatTile label="Renewable" value={formatPct(data.renewablePct)} accent="#22d3a7" />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Load by zone vs capacity</h3>
        <BarChartModule
          data={data.zones.map((z) => ({ label: z.zone, value: z.value, capacity: z.capacity }))}
          unit="kW"
          color="#fbbf24"
        />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Consumption · 48 h</h3>
        <LineChartModule points={data.history} color="#fbbf24" unit="kW" height={220} />
      </section>
    </>
  );
}

function WaterBody({ data }: { data: WaterData }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Daily use" value={`${formatNumber(data.dailyLitres)} L`} accent="#2dd4bf" />
        <StatTile
          label="Conservation target"
          value={`−${data.conservationTargetPct}%`}
          accent="#38bdf8"
        />
        <StatTile label="Open leak alerts" value={String(data.leaks.length)} accent={data.leaks.length ? '#fb7185' : '#22d3a7'} />
        <StatTile
          label="Recycled share"
          value={formatPct(
            ((data.sources.find((s) => s.source === 'Recycled')?.litres ?? 0) / data.dailyLitres) * 100,
            1,
          )}
          accent="#a78bfa"
        />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Source mix</h3>
        <BarChartModule
          data={data.sources.map((s) => ({ label: s.source, value: s.litres }))}
          unit="L"
          color="#2dd4bf"
        />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Consumption · 48 h</h3>
        <LineChartModule points={data.history} color="#2dd4bf" unit="L/h" height={220} />
      </section>
    </>
  );
}

function TrafficBody({ data }: { data: TrafficData }) {
  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Parking"
          value={`${data.parking.occupied}/${data.parking.total}`}
          accent="#fb923c"
        />
        <StatTile label="Vehicles today" value={formatNumber(data.vehiclesToday)} accent="#38bdf8" />
        <StatTile label="Peak hours" value={data.peakHours.join(' · ')} accent="#a78bfa" />
        <StatTile
          label="Busiest zone"
          value={[...data.congestionByZone].sort((a, b) => b.level - a.level)[0]?.zone ?? '—'}
          accent="#fb7185"
        />
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Congestion by zone</h3>
        <BarChartModule
          data={data.congestionByZone.map((c) => ({ label: c.zone, value: c.level }))}
          unit="idx"
          color="#fb923c"
        />
      </section>
    </>
  );
}

function AssetsBody({ data }: { data: AssetData }) {
  const STATUS_STYLE: Record<AssetData['assets'][number]['status'], string> = {
    operational: 'bg-emerald-400/15 text-emerald-300',
    idle: 'bg-slate-400/15 text-slate-300',
    maintenance: 'bg-amber-300/15 text-amber-200',
    fault: 'bg-rose-400/15 text-rose-300',
  };

  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Assets tracked" value={String(data.assets.length)} accent="#94a3b8" />
        <StatTile label="Overdue service" value={String(data.overdueServiceCount)} accent="#fb7185" />
        <StatTile
          label="Operational"
          value={String(data.assets.filter((a) => a.status === 'operational').length)}
          accent="#22d3a7"
        />
        <StatTile label="Predictive alerts" value={String(data.predictiveAlerts.length)} accent="#fbbf24" />
      </section>
      <section className="glass-card overflow-x-auto p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Equipment status</h3>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2">Asset</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Utilisation</th>
              <th className="pb-2">Service</th>
            </tr>
          </thead>
          <tbody>
            {data.assets.map((a) => {
              const overdue = a.hoursSinceService > a.serviceIntervalHours;
              return (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="py-2.5 font-medium text-white">{a.name}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{formatPct(a.utilisationPct)}</td>
                  <td className={`py-2.5 ${overdue ? 'font-semibold text-rose-300' : 'text-slate-400'}`}>
                    {formatNumber(a.hoursSinceService)} / {formatNumber(a.serviceIntervalHours)} h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function SafetyBody({ data }: { data: SafetySummary }) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card flex items-center justify-center p-6">
          <GaugeChart value={data.score} label="Safety score" size={160} />
        </div>
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-white">Incident hotspots (30 d)</h3>
          <BarChartModule
            data={data.hotspots.map((h) => ({ label: h.zone, value: h.count }))}
            unit="incidents"
            color="#fb7185"
          />
          <p className="mt-3 text-xs text-slate-400">Trend: {data.trend}</p>
        </div>
      </section>
      <section className="glass-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Recent incidents</h3>
        <ul className="divide-y divide-white/5 text-sm">
          {data.incidents30d.map((inc) => (
            <li key={inc.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium text-white">{inc.type}</span>
                {inc.nearMiss && (
                  <span className="ml-2 rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    near miss
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-400">
                {inc.zone} · {new Date(inc.occurredAt).toLocaleDateString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function SustainabilityBody({ data }: { data: SustainabilityData }) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card flex items-center justify-center p-6">
          <GaugeChart value={data.score} label="Sustainability" size={160} />
        </div>
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-white">Category breakdown</h3>
          <BarChartModule
            data={data.breakdown.map((b) => ({ label: b.label, value: b.score }))}
            unit="/100"
            color="#22d3a7"
          />
        </div>
      </section>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Carbon footprint" value={`${formatNumber(data.carbonTonsMonth, 1)} t/mo`} accent="#94a3b8" />
        <StatTile label="Renewable energy" value={formatPct(data.renewablePct)} accent="#22d3a7" />
        <StatTile label="Waste-reduction target" value={`${data.wasteReductionTargetPct}%`} accent="#a78bfa" />
        <StatTile label="Target progress" value={formatPct(data.progressPct)} accent="#38bdf8" />
      </section>
    </>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass-card p-4" style={{ borderTop: `2px solid ${accent}` }}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1.5 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
