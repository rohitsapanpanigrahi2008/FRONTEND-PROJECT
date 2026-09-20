import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { NotificationToasts } from '@/components/Common/NotificationToast';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { useIdleSessionTimeout } from '@/hooks/useAuth';
import { useNotificationStore } from '@/store/notificationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';
import { watchLongTasks } from '@/utils/performanceMonitor';
import LoginPage from '@/pages/LoginPage';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ModuleDetailPage = lazy(() => import('@/pages/ModuleDetailPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  useTheme();
  useIdleSessionTimeout((minLeft) => {
    useNotificationStore.getState().push('warning', `You will be signed out in ~${minLeft} min due to inactivity.`);
  });

  useEffect(() => {
    if (reduceMotion) document.documentElement.classList.add('reduce-motion');
    else document.documentElement.classList.remove('reduce-motion');
  }, [reduceMotion]);

  useEffect(() => watchLongTasks((ms) => {
    if (import.meta.env.DEV && ms > 120) console.warn(`[perf] long task: ${Math.round(ms)}ms`);
  }), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center">
                <LoadingSpinner size="lg" label="Loading dashboard" />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="modules/:moduleId" element={<ModuleDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <NotificationToasts />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
