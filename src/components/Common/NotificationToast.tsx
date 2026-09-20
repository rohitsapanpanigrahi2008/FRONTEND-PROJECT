import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useNotificationStore, type ToastKind } from '@/store/notificationStore';

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5 text-rose-400" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-sky-400" aria-hidden="true" />,
};

export function NotificationToasts() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className={`glass-panel pointer-events-auto flex items-start gap-3 p-4 shadow-glass ${
              t.kind === 'error' ? 'border-rose-500/40' : ''
            }`}
            role="alert"
          >
            {ICONS[t.kind]}
            <p className="flex-1 text-sm text-slate-200">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded p-1 text-slate-400 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
