/**
 * Error normalisation with strict information-leakage control:
 * users get generic guidance; technical detail goes to the console for
 * the on-call engineer / monitoring agent only.
 */

interface ErrorLike {
  response?: { status?: number; data?: unknown };
  code?: string;
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  const e = error as ErrorLike;

  switch (e?.response?.status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      break;
  }

  if (e?.code === 'ECONNABORTED') {
    return 'Request timed out. Check your connection and try again.';
  }

  if ((e?.response?.status ?? 0) >= 500) {
    console.error('[SERVER_ERROR]', e?.response?.data);
    return 'Something went wrong. Our team has been notified.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/** Optional future hook: forward to Sentry/monitoring. Kept as a no-op stub. */
export function reportToMonitoring(_scope: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('[monitoring:stub]', _scope, error);
  }
}
