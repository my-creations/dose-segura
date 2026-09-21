import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { Strings } from '@/constants/Strings';

const mockInstallApp = jest.fn();
const mockDismissBanner = jest.fn();
const mockSetShowInstructions = jest.fn();

let mockHookValue = {
  isBannerVisible: true,
  installApp: mockInstallApp,
  dismissBanner: mockDismissBanner,
  showInstructions: false,
  setShowInstructions: mockSetShowInstructions,
};

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: () => mockHookValue,
}));

const banner = Strings.pt.settings.install.banner;

describe('PWAInstallBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookValue = {
      isBannerVisible: true,
      installApp: mockInstallApp,
      dismissBanner: mockDismissBanner,
      showInstructions: false,
      setShowInstructions: mockSetShowInstructions,
    };
  });

  it('renders nothing until the app is installable and undismissed', () => {
    mockHookValue = { ...mockHookValue, isBannerVisible: false };

    render(<PWAInstallBanner />);

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
  });

  it('shows the install copy and both actions', () => {
    render(<PWAInstallBanner />);

    expect(screen.getByTestId('pwa-install-banner')).toBeTruthy();
    expect(screen.getByText(banner.title)).toBeTruthy();
    expect(screen.getByText(banner.body)).toBeTruthy();
    expect(screen.getByTestId('pwa-install-banner-install')).toBeTruthy();
    expect(screen.getByTestId('pwa-install-banner-dismiss')).toBeTruthy();
  });

  it('starts the install flow from the CTA', () => {
    render(<PWAInstallBanner />);

    fireEvent.press(screen.getByTestId('pwa-install-banner-install'));

    expect(mockInstallApp).toHaveBeenCalledTimes(1);
    expect(mockDismissBanner).not.toHaveBeenCalled();
  });

  it('dismisses from the close button without triggering install', () => {
    render(<PWAInstallBanner />);

    fireEvent.press(screen.getByTestId('pwa-install-banner-dismiss'));

    expect(mockDismissBanner).toHaveBeenCalledTimes(1);
    expect(mockInstallApp).not.toHaveBeenCalled();
  });

  it('opens the iOS instructions modal when the install flow asks for it', () => {
    mockHookValue = { ...mockHookValue, showInstructions: true };

    render(<PWAInstallBanner />);

    expect(screen.getByTestId('pwa-install-modal')).toBeTruthy();
  });

  it('labels both actions for screen readers', () => {
    render(<PWAInstallBanner />);

    expect(screen.getByLabelText(banner.cta)).toBeTruthy();
    expect(screen.getByLabelText(banner.dismiss)).toBeTruthy();
  });
});
