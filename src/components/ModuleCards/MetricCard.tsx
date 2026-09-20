import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { MetricReading } from '@/types';
import { formatNumber, formatTrend } from '@/utils/formatters';

interface Props {
  metric: MetricReading;
  index?: number;
}

export function MetricCard({ metric, index = 0 }: Props) {
  const bad = metric.higherIsWorse
    ? metric.value >= metric.thresholds.critical
    : metric.value <= metric.thresholds.critical;
  const warn = !bad && metric.higherIsWorse
    ? metric.value >= metric.thresholds.warn
    : metric.value <= metric.thresholds.warn;

  const statusColor = bad ? 'text-rose-400' : warn ? 'text-amber-300' : 'text-emerald-400';
  const rising = metric.trendPct > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -3 }}
      className="glass-card p-5"
      data-testid={`metric-${metric.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-400">{metric.label}</h3>
        <span className={`text-xs font-semibold ${statusColor}`}>
          {bad ? 'CRITICAL' : warn ? 'WARN' : 'OK'}
        </span>
      </div>

      <motion.p
        className="mt-2 text-3xl font-bold text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15 + index * 0.07 }}
      >
        {formatNumber(metric.value, 1)}
        <span className="ml-1 text-sm font-medium text-slate-400">{metric.unit}</span>
      </motion.p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span className={rising ? 'text-rose-400' : 'text-emerald-400'}>
          {rising ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        </span>
        <span className={rising ? 'text-rose-400' : 'text-emerald-400'}>
          {formatTrend(metric.trendPct)}
        </span>
        <span className="text-slate-500">vs 7-day mean</span>
      </div>
    </motion.div>
  );
}
