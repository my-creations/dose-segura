import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

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
  beforeEach(() => {
    jest.mocked(router.push).mockClear();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('renders legal links and opens privacy, terms, and contact', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('legal-section')).toBeTruthy();
    expect(screen.getByText(Strings.pt.settings.privacy)).toBeTruthy();
    expect(screen.getByText(Strings.pt.settings.terms)).toBeTruthy();
    expect(screen.getByText(Strings.pt.settings.contact)).toBeTruthy();
    expect(screen.getByText(Strings.pt.settings.contactEmail)).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-privacy-link'));
    expect(router.push).toHaveBeenCalledWith('/privacy');

    fireEvent.press(screen.getByTestId('settings-terms-link'));
    expect(router.push).toHaveBeenCalledWith('/terms');

    fireEvent.press(screen.getByTestId('settings-contact-link'));
    expect(Linking.openURL).toHaveBeenCalledWith(`mailto:${Strings.pt.settings.contactEmail}`);
  });
});
