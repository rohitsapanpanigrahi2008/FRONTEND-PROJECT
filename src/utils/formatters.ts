/** Display formatters. All input is treated as untrusted numbers. */

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-IN', opts);

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  return nf({ maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return nf({ notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatPct(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  return `${nf({ maximumFractionDigits: digits }).format(value)}%`;
}

export function formatTrend(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${nf({ maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatEta(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return '—';
  if (hours < 1) return '<1 h';
  if (hours > 72) return '>72 h';
  return `~${Math.round(hours)} h`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
