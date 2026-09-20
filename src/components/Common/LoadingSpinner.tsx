interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };

export function LoadingSpinner({ size = 'md', label = 'Loading' }: Props) {
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-slate-600 border-t-sky-400 ${SIZES[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}…</span>
    </div>
  );
}
