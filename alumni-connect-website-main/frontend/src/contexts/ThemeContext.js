import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Migrate legacy theme values to consolidated Alumnex design tokens
const migrateTheme = (saved) => {
  if (!saved) return 'alumnex-light';
  if (
    saved === 'light' || 
    saved === 'alumnex-light' || 
    saved === 'designcode-light' || 
    saved === 'minimalist-light' || 
    saved === 'heroui-light'
  ) {
    return 'alumnex-light';
  }
  if (
    saved === 'dark' || 
    saved === 'alumnex-dark' || 
    saved === 'designcode-dark' || 
    saved === 'minimalist-dark' || 
    saved === 'heroui-dark' || 
    saved === 'cyber-neon'
  ) {
    return 'alumnex-dark';
  }
  if (saved === 'stitch') {
    return 'stitch';
  }
  return 'alumnex-light';
};

const LEGACY_THEME_CLASSES = [
  'dark',
  'theme-minimalist-light',
  'theme-minimalist-dark',
  'theme-cyber-neon',
  'theme-heroui-light',
  'theme-heroui-dark',
  'theme-designcode-light',
  'theme-designcode-dark',
  'theme-stitch',
  'theme-alumnex-light',
  'theme-alumnex-dark'
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage or system preference on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return migrateTheme(savedTheme);
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'alumnex-dark';
    }
    return 'alumnex-light';
  });

  // Tracks whether dark mode is being forced (e.g. by landing page or high-contrast overlay)
  const [isDarkForced, setIsDarkForced] = useState(false);

  // The theme value that CSS actually sees
  const activeTheme = isDarkForced ? 'alumnex-dark' : theme;

  useEffect(() => {
    // Persist user preference
    if (!isDarkForced) {
      localStorage.setItem('theme', theme);
    }

    const applied = isDarkForced ? 'alumnex-dark' : theme;

    // Remove obsolete theme classes
    document.documentElement.classList.remove(...LEGACY_THEME_CLASSES);

    // Apply clean Alumnex theme classes
    if (applied === 'alumnex-dark') {
      document.documentElement.classList.add('dark', 'theme-alumnex-dark');
    } else if (applied === 'stitch') {
      document.documentElement.classList.add('dark', 'theme-stitch');
    } else {
      document.documentElement.classList.add('theme-alumnex-light');
    }
  }, [theme, isDarkForced]);

  // Toggle between Alumnex Light and Alumnex Dark
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const isCurrentlyDark = prev === 'alumnex-dark' || prev === 'stitch' || prev.includes('dark');
      return isCurrentlyDark ? 'alumnex-light' : 'alumnex-dark';
    });
  }, []);

  const changeTheme = useCallback((newTheme) => {
    setTheme(migrateTheme(newTheme));
  }, []);

  const forceDarkMode = useCallback(() => {
    setIsDarkForced(true);
  }, []);

  const releaseDarkMode = useCallback(() => {
    setIsDarkForced(false);
  }, []);

  // Helper: is the active theme visually dark?
  const isDark = activeTheme === 'alumnex-dark' || activeTheme === 'stitch' || activeTheme.includes('dark');

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, isDark, toggleTheme, changeTheme, forceDarkMode, releaseDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
