import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type Density = 'comfortable' | 'compact';

const PREFS_KEY = 'fd.prefs.v1';

interface Prefs {
  theme: Theme;
  density: Density;
  reduceMotion: boolean;
}

interface SettingsState extends Prefs {
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { theme: 'dark', density: 'comfortable', reduceMotion: false };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      reduceMotion: parsed.reduceMotion === true,
    };
  } catch {
    return { theme: 'dark', density: 'comfortable', reduceMotion: false };
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadPrefs(),
  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },
  setDensity: (density) => {
    set({ density });
    persist(get());
  },
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
    persist(get());
  },
}));

function persist(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable — preferences stay in-memory */
  }
}
