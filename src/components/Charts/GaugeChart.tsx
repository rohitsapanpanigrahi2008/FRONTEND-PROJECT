import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface Props {
  value: number;
  label?: string;
  size?: number;
  invertColor?: boolean;
}

function scoreColor(value: number, invert: boolean): string {
  const v = invert ? 100 - value : value;
  if (v >= 75) return '#22d3a7';
  if (v >= 50) return '#fbbf24';
  return '#fb7185';
}

export function GaugeChart({ value, label, size = 150, invertColor = false }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = scoreColor(clamped, invertColor);
  const data = [{ name: 'score', value: clamped, fill: color }];

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Score'}: ${clamped} out of 100`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={220}
          endAngle={-40}
          barSize={12}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: 'rgba(148,163,184,0.12)' }} dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(clamped)}</span>
        {label && <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
