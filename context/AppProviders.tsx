import React from 'react';

import { FavoritesProvider } from '@/context/FavoritesContext';
import { MedicationsProvider } from '@/context/MedicationsContext';
import { AppThemeProvider } from '@/context/ThemeContext';

/** Shared domain provider tree for native and web roots. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <MedicationsProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </MedicationsProvider>
    </AppThemeProvider>
  );
}
