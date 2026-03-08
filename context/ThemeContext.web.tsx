import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';
import { THEME_STORAGE_KEY } from '@/constants/Theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextData {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return 'system' as ThemeMode;
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
    return savedTheme;
  }

  return 'system' as ThemeMode;
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setThemeModeState(readStoredTheme());
    setIsLoaded(true);
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const resolvedTheme = themeMode === 'system'
    ? (systemTheme ?? 'light')
    : themeMode;

  useEffect(() => {
    if (!isLoaded || typeof document === 'undefined') {
      return;
    }

    const backgroundColor = Colors[resolvedTheme].background;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
    document.body.style.backgroundColor = backgroundColor;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    themeColorMeta?.setAttribute('content', backgroundColor);
  }, [isLoaded, resolvedTheme]);

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
}
