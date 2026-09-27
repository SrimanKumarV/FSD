import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Migrate legacy 'light'/'dark' values to the new DC defaults
const migrateTheme = (saved) => {
  if (saved === 'light') return 'designcode-light';
  if (saved === 'dark') return 'designcode-dark';
  return saved;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage or system preference on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return migrateTheme(savedTheme);
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'designcode-dark';
    }
    return 'designcode-light';
  });

  // Tracks whether dark mode is being forced (e.g. by the landing page)
  const [isDarkForced, setIsDarkForced] = useState(false);
  const savedThemeRef = useRef(null);

  // The theme value that CSS actually sees (forced override or user choice)
  const activeTheme = isDarkForced ? 'designcode-dark' : theme;

  useEffect(() => {
    // Persist the user's real preference (not the forced override)
    if (!isDarkForced) {
      localStorage.setItem('theme', theme);
    }

    const applied = isDarkForced ? 'designcode-dark' : theme;

    // Remove previous theme classes
    document.documentElement.classList.remove('dark', 'theme-minimalist-light', 'theme-minimalist-dark', 'theme-cyber-neon', 'theme-heroui-light', 'theme-heroui-dark', 'theme-designcode-light', 'theme-designcode-dark', 'theme-stitch');

    // Apply appropriate classes based on the active theme
    if (applied === 'designcode-light') {
      document.documentElement.classList.add('theme-designcode-light');
    } else if (applied === 'designcode-dark') {
      document.documentElement.classList.add('theme-designcode-dark');
      document.documentElement.classList.add('dark');
    } else if (applied === 'light') {
      // Classic light — no extra classes needed (Tailwind default)
    } else if (applied === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add(`theme-${applied}`);
      // For dark variants, also add 'dark' so that Tailwind dark utilities still apply
      if (applied.includes('dark') || applied === 'cyber-neon') {
        document.documentElement.classList.add('dark');
      }
    }
  }, [theme, isDarkForced]);

  // Toggle between the two DC default themes
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      // If user has a non-DC theme, toggle to the opposite DC variant
      const isDark = prev.includes('dark') || prev === 'cyber-neon';
      return isDark ? 'designcode-light' : 'designcode-dark';
    });
  }, []);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
  }, []);

  // Force dark mode (used by landing page). Saves the current theme and overrides display.
  const forceDarkMode = useCallback(() => {
    savedThemeRef.current = theme;
    setIsDarkForced(true);
  }, [theme]);

  // Release dark mode override and restore the user's real preference.
  const releaseDarkMode = useCallback(() => {
    setIsDarkForced(false);
    if (savedThemeRef.current) {
      setTheme(savedThemeRef.current);
      savedThemeRef.current = null;
    }
  }, []);

  // Helper: is the active theme visually dark?
  const isDark = activeTheme.includes('dark') || activeTheme === 'cyber-neon';

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, isDark, toggleTheme, changeTheme, forceDarkMode, releaseDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
