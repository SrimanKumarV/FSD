import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage or system preference on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Update local storage and document class when theme changes
    localStorage.setItem('theme', theme);
    
    // Remove previous theme classes
    document.documentElement.classList.remove('dark', 'theme-minimalist-light', 'theme-minimalist-dark', 'theme-cyber-neon');
    
    // Apply appropriate classes based on the theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme !== 'light') {
      document.documentElement.classList.add(`theme-${theme}`);
      // For dark variants, also add 'dark' so that Tailwind dark utilities still apply
      if (theme.includes('dark') || theme === 'cyber-neon') {
        document.documentElement.classList.add('dark');
      }
    }
  }, [theme]);

  // Support legacy toggleTheme (defaults to toggling light/dark)
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
