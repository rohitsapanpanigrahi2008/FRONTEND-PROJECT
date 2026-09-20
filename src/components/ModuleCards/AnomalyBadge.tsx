import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { Anomaly, Severity } from '@/types';
import { SEVERITY_COLORS } from '@/config/constants';

interface Props {
  anomaly: Anomaly;
  onClick?: (anomaly: Anomaly) => void;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function AnomalyBadge({ anomaly, onClick }: Props) {
  const color = SEVERITY_COLORS[anomaly.severity];

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(anomaly)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card flex w-full items-center gap-3 p-3.5 text-left"
      style={{ borderColor: `${color}55` }}
      aria-label={`Anomaly: ${anomaly.title}, severity ${SEVERITY_LABEL[anomaly.severity]}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${anomaly.severity === 'critical' ? 'data-pulse' : ''}`}
        style={{ background: `${color}22`, color }}
      >
        <AlertTriangle className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{anomaly.title}</span>
        <span className="block truncate text-xs text-slate-400">
          {anomaly.zone ? `${anomaly.zone} · ` : ''}
          {(anomaly.confidence * 100).toFixed(0)}% confidence
        </span>
      </span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: `${color}22`, color }}
      >
        {SEVERITY_LABEL[anomaly.severity]}
      </span>
    </motion.button>
  );
}
