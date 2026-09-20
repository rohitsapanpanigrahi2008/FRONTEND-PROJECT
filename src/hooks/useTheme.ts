import { useEffect } from 'react';
import { useSettingsStore, type Theme } from '@/store/settingsStore';

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSettingsStore((s) => s.theme);
  const density = useSettingsStore((s) => s.density);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.density = density;
    root.dataset.reduceMotion = String(reduceMotion);
  }, [theme, density, reduceMotion]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    useSettingsStore().setTheme(next);
  };

  return { theme, toggleTheme };
}
