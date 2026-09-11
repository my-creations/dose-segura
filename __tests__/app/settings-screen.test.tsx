import React from 'react';
import { render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/(tabs)/settings';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.1.0',
    },
  },
}));

jest.mock('@/context/MedicationsContext', () => ({
  useMedications: () => ({
    version: 'db-test',
    lastUpdated: '2026-01-01',
    medications: [],
  }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    themeMode: 'system',
    setThemeMode: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({
    isStandalone: true,
    installApp: jest.fn(),
    showInstructions: false,
    setShowInstructions: jest.fn(),
  }),
}));

describe('SettingsScreen', () => {
  it('resolves app version to 1.1.0 and renders Novidades 1.1.0', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('settings-screen')).toBeTruthy();
    expect(screen.getByText('1.1.0')).toBeTruthy();
    expect(screen.getByTestId('whats-new-1-1-0')).toBeTruthy();
    expect(screen.getByText(Strings.pt.settings.whatsNew.title)).toBeTruthy();
    for (const item of Strings.pt.settings.whatsNew.items) {
      expect(screen.getByText(`• ${item}`)).toBeTruthy();
    }
  });
});
