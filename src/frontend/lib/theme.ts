// Theme Management (Light, Dark, System)

export type Theme = 'dark' | 'light' | 'system';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('jobradar_theme') as Theme | null;
  if (saved && ['dark', 'light', 'system'].includes(saved)) {
    return saved;
  }
  return 'dark'; // Dark theme default
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  localStorage.setItem('jobradar_theme', theme);
}
