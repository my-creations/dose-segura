import React from 'react';

import { FavoritesProvider } from '@/context/FavoritesContext';
import { ProceduresProvider } from '@/context/ProceduresContext';
import { MedicationsProvider } from '@/context/MedicationsContext';
import { AppThemeProvider } from '@/context/ThemeContext';

/** Shared domain provider tree for native and web roots. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <MedicationsProvider>
        <FavoritesProvider>
          <ProceduresProvider>{children}</ProceduresProvider>
        </FavoritesProvider>
      </MedicationsProvider>
    </AppThemeProvider>
  );
}
