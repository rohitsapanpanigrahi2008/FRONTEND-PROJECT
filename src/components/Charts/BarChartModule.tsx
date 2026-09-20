import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Datum {
  label: string;
  value: number;
  capacity?: number;
}

interface Props {
  data: Datum[];
  height?: number;
  color?: string;
  warnRatio?: number;
  criticalRatio?: number;
  unit?: string;
}

function BarTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: Datum }[];
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-panel px-3 py-2 text-xs shadow-glass">
      <p className="font-semibold text-white">{d.label}</p>
      <p className="text-slate-300">
        {d.value.toFixed(1)} {unit}
        {d.capacity ? ` / ${d.capacity} ${unit}` : ''}
      </p>
    </div>
  );
}

export function BarChartModule({
  data,
  height = 240,
  color = '#22d3a7',
  warnRatio = 0.7,
  criticalRatio = 0.9,
  unit = '',
}: Props) {
  return (
    <div style={{ height }} role="img" aria-label="Zone comparison bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="label"
            stroke="rgba(148,163,184,0.5)"
            tick={{ fontSize: 12, fill: 'rgba(203,213,225,0.9)' }}
            tickLine={false}
            axisLine={false}
            width={92}
          />
          <Tooltip content={<BarTooltip unit={unit} />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} animationDuration={600}>
            {data.map((d) => {
              const ratio = d.capacity ? d.value / d.capacity : d.value / 100;
              const fill = ratio >= criticalRatio ? '#fb7185' : ratio >= warnRatio ? '#fbbf24' : color;
              return <Cell key={d.label} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
