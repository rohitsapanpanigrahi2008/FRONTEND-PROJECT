import { create } from 'zustand';
import type { CityResult } from '@/types/location';

interface LocationState {
  /**
   * `null` = no city chosen yet → the dashboard keeps its built-in synthetic
   * fallback data (the pre-feature default). Setting a city switches AQI-bound
   * components to live data for that location.
   */
  selectedCity: CityResult | null;
  selectCity: (city: CityResult | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedCity: null,
  selectCity: (selectedCity) => set({ selectedCity }),
}));
