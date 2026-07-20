import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';
import { keyValueStore } from '@/storage/keyValueStore';
import type { KeyValueStore } from '@/storage/types';
import {
  applyDocumentTheme,
  parseThemeMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  ThemeMode,
  ResolvedTheme,
} from '@/theme/theme';

export type { ThemeMode, ResolvedTheme };

interface ThemeContextData {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

interface AppThemeProviderProps {
  children: React.ReactNode;
  /** Optional store override for tests. */
  store?: KeyValueStore;
}

export function AppThemeProvider({ children, store = keyValueStore }: AppThemeProviderProps) {
  const systemTheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadThemePreference() {
      try {
        const savedTheme = await store.getItem(THEME_STORAGE_KEY);
        if (!cancelled) {
          setThemeModeState(parseThemeMode(savedTheme));
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadThemePreference();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await store.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const resolvedTheme = resolveTheme(themeMode, systemTheme);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    applyDocumentTheme(resolvedTheme, Colors[resolvedTheme].background);
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
