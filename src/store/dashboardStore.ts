import { create } from 'zustand';
import type { ModuleId } from '@/types';

export type TimeRange = '24h' | '7d' | '30d';

interface DashboardState {
  facilityId: string;
  selectedModule: ModuleId | null;
  timeRange: TimeRange;
  liveEnabled: boolean;
  setFacility: (id: string) => void;
  selectModule: (id: ModuleId | null) => void;
  setTimeRange: (range: TimeRange) => void;
  toggleLive: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  facilityId: 'facility-demo-01',
  selectedModule: null,
  timeRange: '24h',
  liveEnabled: true,
  setFacility: (facilityId) => set({ facilityId }),
  selectModule: (selectedModule) => set({ selectedModule }),
  setTimeRange: (timeRange) => set({ timeRange }),
  toggleLive: () => set((s) => ({ liveEnabled: !s.liveEnabled })),
}));
