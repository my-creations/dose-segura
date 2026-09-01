import React from 'react';

import { CookieConsentProvider } from '@/context/CookieConsentContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { MedicationsProvider } from '@/context/MedicationsContext';
import { AppThemeProvider } from '@/context/ThemeContext';

/** Shared domain provider tree for native and web roots. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <CookieConsentProvider>
        <MedicationsProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </MedicationsProvider>
      </CookieConsentProvider>
    </AppThemeProvider>
  );
}
