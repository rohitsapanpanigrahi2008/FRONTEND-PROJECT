import api from './api';
import { env } from '@/config/environment';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { mockGet } from './mockApi';
import { sanitizeDeep } from '@/utils/sanitizers';
import type {
  Anomaly,
  DashboardSummary,
  Forecast,
  ModulePayload,
  Recommendation,
  ModuleId,
} from '@/types';

/**
 * Typed data-access layer. In mock mode it never touches the network; with a
 * real backend it rides the hardened axios instance. All payloads are
 * deep-sanitized before leaving this layer.
 */
export const apiClient = {
  async getDashboard(facilityId: string): Promise<DashboardSummary> {
    const path = API_ENDPOINTS.facilities.dashboard(facilityId);
    const data = env.useMockApi ? await mockGet<DashboardSummary>(path) : (await api.get<DashboardSummary>(path)).data;
    return sanitizeDeep(data);
  },

  async getModule(facilityId: string, moduleId: ModuleId): Promise<ModulePayload> {
    const path = API_ENDPOINTS.facilities.module(facilityId, moduleId);
    const data = env.useMockApi ? await mockGet<ModulePayload>(path) : (await api.get<ModulePayload>(path)).data;
    return sanitizeDeep(data);
  },

  async getForecast(facilityId: string, moduleId: ModuleId): Promise<Forecast> {
    const path = API_ENDPOINTS.facilities.forecast(facilityId, moduleId);
    const data = env.useMockApi ? await mockGet<Forecast>(path) : (await api.get<Forecast>(path)).data;
    return sanitizeDeep(data);
  },

  async getAnomalies(facilityId: string): Promise<Anomaly[]> {
    const path = API_ENDPOINTS.facilities.anomalies(facilityId);
    const data = env.useMockApi ? await mockGet<Anomaly[]>(path) : (await api.get<Anomaly[]>(path)).data;
    return sanitizeDeep(data);
  },

  async getRecommendations(facilityId: string): Promise<Recommendation[]> {
    const path = API_ENDPOINTS.facilities.recommendations(facilityId);
    const data = env.useMockApi
      ? await mockGet<Recommendation[]>(path)
      : (await api.get<Recommendation[]>(path)).data;
    return sanitizeDeep(data);
  },
};
