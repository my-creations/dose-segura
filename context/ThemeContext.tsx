import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useNativeColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextData {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

const THEME_STORAGE_KEY = 'dose_segura_theme_preference';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getStoredWebTheme(): ThemeMode | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(savedTheme) ? savedTheme : null;
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return null;
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredWebTheme() ?? 'system');
  const [isLoaded, setIsLoaded] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeMode(savedTheme)) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    // Optimistic update
    setThemeModeState(mode);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
      return;
    }

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const resolvedTheme = themeMode === 'system' 
    ? (systemTheme ?? 'light') 
    : themeMode;

  // Don't render children until we've loaded the preference to avoid flash of wrong theme
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
