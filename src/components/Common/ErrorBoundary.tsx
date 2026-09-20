import React from 'react';
import { reportToMonitoring } from '@/utils/errorHandlers';

interface Props {
  children: React.ReactNode;
  /** Optional lightweight fallback UI (e.g. for 3D panels inside cards). */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Detail stays in the console/monitoring; the UI stays generic.
    console.error('[ERROR_BOUNDARY]', error, errorInfo);
    reportToMonitoring('error-boundary', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center bg-night-950 px-4">
          <div className="glass-panel max-w-md p-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mb-6 text-slate-300">We're working to fix the issue.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] rounded-lg bg-sky-500 px-6 py-2 font-semibold text-white transition hover:bg-sky-400"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
