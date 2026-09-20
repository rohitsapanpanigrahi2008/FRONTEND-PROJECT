import { Info } from 'lucide-react';
import { useForecast } from '@/hooks/useApi';
import type { ModuleId } from '@/types';
import { LineChartModule } from '@/components/Charts/LineChartModule';
import { Skeleton } from '@/components/Common/SkeletonLoader';

interface Props {
  moduleId: ModuleId;
}

export function ForecastPanel({ moduleId }: Props) {
  const { data, isLoading, isError } = useForecast(moduleId);

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-card p-5 text-sm text-slate-400">Forecast unavailable right now.</div>
    );
  }

  return (
    <section className="glass-card p-5" aria-label="Short-term forecast">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          24-hour forecast <span className="text-slate-400">· {data.metric}</span>
        </h3>
        <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
          {data.model}
        </span>
      </header>

      <LineChartModule points={data.points} color="#a78bfa" unit={data.unit} showConfidence height={180} />

      <details className="group mt-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <Info className="h-3.5 w-3.5" />
          Model assumptions ({data.assumptions.length})
        </summary>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
          {data.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
