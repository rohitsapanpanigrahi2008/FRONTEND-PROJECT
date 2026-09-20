export interface HeatCell {
  zone: string;
  hour: number;
  value: number; // 0..100
}

interface Props {
  cells: HeatCell[];
  zones: string[];
  unitLabel?: string;
}

function cellColor(v: number): string {
  if (v >= 85) return 'bg-rose-500/80';
  if (v >= 65) return 'bg-orange-400/75';
  if (v >= 45) return 'bg-amber-300/65';
  if (v >= 25) return 'bg-sky-400/55';
  return 'bg-sky-500/25';
}

export function HeatmapChart({ cells, zones, unitLabel = 'load' }: Props) {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  const valueFor = (zone: string, hour: number): number =>
    cells.find((c) => c.zone === zone && c.hour === hour)?.value ?? 0;

  return (
    <div className="overflow-x-auto" role="img" aria-label={`Heatmap of ${unitLabel}`}>
      <div className="min-w-[520px]">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `88px repeat(${hours.length}, 1fr)` }}
        >
          <div />
          {hours.map((h) => (
            <div key={h} className="text-center text-[10px] text-slate-400">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
          {zones.map((zone) => (
            <div key={zone} className="contents">
              <div className="pr-2 text-right text-xs text-slate-300">{zone}</div>
              {hours.map((h) => {
                const v = valueFor(zone, h);
                return (
                  <div
                    key={`${zone}-${h}`}
                    className={`h-7 rounded ${cellColor(v)} transition-transform hover:scale-110`}
                    title={`${zone} · ${String(h).padStart(2, '0')}:00 — ${Math.round(v)} ${unitLabel}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
          <span>low</span>
          <div className="h-2 w-32 rounded-full bg-gradient-to-r from-sky-500/25 via-amber-300/65 to-rose-500/80" />
          <span>high</span>
        </div>
      </div>
    </div>
  );
}
