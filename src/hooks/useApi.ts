import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useDashboardStore } from '@/store/dashboardStore';
import type { Anomaly, Forecast, ModuleId, ModulePayload, Recommendation } from '@/types';

const STALE_5_MIN = 5 * 60 * 1000;
const GC_30_MIN = 30 * 60 * 1000;
const REFRESH_60S = 60 * 1000;

export function useDashboard(facilityId: string) {
  return useQuery({
    queryKey: ['dashboard', facilityId],
    queryFn: () => apiClient.getDashboard(facilityId),
    staleTime: STALE_5_MIN,
    gcTime: GC_30_MIN,
    refetchOnWindowFocus: false,
    refetchInterval: REFRESH_60S,
  });
}

export function useModuleData(moduleId: ModuleId) {
  const facilityId = useDashboardStore((s) => s.facilityId);
  const liveEnabled = useDashboardStore((s) => s.liveEnabled);
  return useQuery({
    queryKey: ['module', facilityId, moduleId],
    queryFn: () => apiClient.getModule(facilityId, moduleId),
    staleTime: STALE_5_MIN,
    gcTime: GC_30_MIN,
    refetchOnWindowFocus: false,
    refetchInterval: liveEnabled ? REFRESH_60S : false,
  });
}

export function useForecast(moduleId: ModuleId) {
  const facilityId = useDashboardStore((f) => f.facilityId);
  return useQuery({
    queryKey: ['forecast', facilityId, moduleId],
    queryFn: () => apiClient.getForecast(facilityId, moduleId),
    staleTime: 10 * 60 * 1000,
    gcTime: GC_30_MIN,
    refetchOnWindowFocus: false,
  });
}

export function useAnomalies() {
  const facilityId = useDashboardStore((s) => s.facilityId);
  return useQuery({
    queryKey: ['anomalies', facilityId],
    queryFn: () => apiClient.getAnomalies(facilityId),
    staleTime: STALE_5_MIN,
    refetchInterval: REFRESH_60S,
  });
}

export function useRecommendations() {
  const facilityId = useDashboardStore((s) => s.facilityId);
  return useQuery({
    queryKey: ['recommendations', facilityId],
    queryFn: () => apiClient.getRecommendations(facilityId),
    staleTime: STALE_5_MIN,
  });
}

export function useInvalidateModule() {
  const queryClient = useQueryClient();
  return (moduleId: ModuleId) => {
    void queryClient.invalidateQueries({ queryKey: ['module', moduleId] });
  };
}

/* Type re-exports for convenience in pages */
export type { ModulePayload, Forecast, Anomaly, Recommendation };
