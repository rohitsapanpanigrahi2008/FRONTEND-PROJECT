import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeSeriesPoint } from '@/types';
import { formatTime } from '@/utils/formatters';

interface Props {
  points: TimeSeriesPoint[];
  color?: string;
  unit?: string;
  height?: number;
  showConfidence?: boolean;
}

interface TooltipPayloadEntry {
  payload: TimeSeriesPoint;
}

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-panel px-3 py-2 text-xs shadow-glass">
      <p className="mb-1 text-slate-400">{formatTime(p.t)}</p>
      <p className="font-semibold text-white">
        {p.value.toFixed(1)} <span className="text-slate-400">{unit}</span>
      </p>
      {p.hi !== undefined && p.lo !== undefined && (
        <p className="text-slate-400">
          band {p.lo.toFixed(1)}–{p.hi.toFixed(1)}
        </p>
      )}
    </div>
  );
}

export function LineChartModule({
  points,
  color = '#38bdf8',
  unit = '',
  height = 240,
  showConfidence = false,
}: Props) {
  const hasBand = showConfidence && points.some((p) => p.hi !== undefined);

  return (
    <div style={{ height }} role="img" aria-label={`Trend chart, ${unit}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t: string) => formatTime(t)}
            stroke="rgba(148,163,184,0.5)"
            tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.8)' }}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
          />
          <YAxis
            stroke="rgba(148,163,184,0.5)"
            tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.8)' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: 'rgba(148,163,184,0.3)' }} />
          {hasBand && (
            <Area
              type="monotone"
              dataKey="hi"
              stroke="none"
              fill={color}
              fillOpacity={0.08}
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            fill={`url(#grad-${color.replace('#', '')})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
