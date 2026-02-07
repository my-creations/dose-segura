/* cspell:disable */
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import i18n from '@/utils/i18n';

// Mock window and navigator
const originalWindow = global.window;
const originalNavigator = global.navigator;
const originalDocument = global.document;
const originalPlatformOS = Platform.OS;
const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36';

type PWAInstallValue = ReturnType<typeof usePWAInstall>;

describe('usePWAInstall', () => {
  let eventListeners: Record<string, ((event?: any) => void)[]> = {};

  function renderWithHarness(onReady: (value: PWAInstallValue) => void) {
    function TestHarness() {
      const hookValue = usePWAInstall();

      useEffect(() => {
        onReady(hookValue);
      }, [hookValue]);

      return null;
    }

    render(<TestHarness />);
  }

  beforeAll(() => {
    const globalAny = global as any;
    
    // Backup and redefine window
    delete globalAny.window;
    globalAny.window = {
      addEventListener: jest.fn((event: string, cb: (event?: any) => void) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(cb);
      }),
      removeEventListener: jest.fn((event: string, cb: (event?: any) => void) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter(l => l !== cb);
        }
      }),
      matchMedia: jest.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
      navigator: {
        userAgent: defaultUserAgent,
        standalone: false,
      },
    };
    
    globalAny.navigator = globalAny.window.navigator;
    globalAny.document = {
      referrer: '',
    };
  });

  afterAll(() => {
    const globalAny = global as any;
    globalAny.window = originalWindow;
    globalAny.navigator = originalNavigator;
    globalAny.document = originalDocument;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = {};
    jest.mocked(window.matchMedia).mockReturnValue({ matches: false } as any);
    Platform.OS = originalPlatformOS;
    Object.defineProperty(window.navigator, 'userAgent', {
      value: defaultUserAgent,
      configurable: true,
    });
  });

  it('should have the correct locale initialized', () => {
    expect(i18n.locale).toBe('pt');
  });

  it('should initialize with correct default values', async () => {
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    expect(hookValue!.isInstallable).toBe(false);
    expect(hookValue!.isStandalone).toBe(false);
    expect(hookValue!.showInstructions).toBe(false);
  });

  it('should detect standalone mode via matchMedia', async () => {
    jest.mocked(window.matchMedia).mockReturnValue({ matches: true } as any);
    
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue?.isStandalone).toBe(true);
    });
  });

  it('should update isInstallable when beforeinstallprompt event fires', async () => {
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    await act(async () => {
      const event = {
        preventDefault: jest.fn(),
      };
      eventListeners['beforeinstallprompt']?.forEach(cb => cb(event));
    });

    expect(hookValue!.isInstallable).toBe(true);
  });

  it('should update state when appinstalled event fires', async () => {
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    // First make it installable
    await act(async () => {
      eventListeners['beforeinstallprompt']?.forEach(cb => cb({ preventDefault: jest.fn() }));
    });
    expect(hookValue!.isInstallable).toBe(true);

    // Then simulate installation
    await act(async () => {
      eventListeners['appinstalled']?.forEach(cb => cb());
    });

    expect(hookValue!.isStandalone).toBe(true);
    expect(hookValue!.isInstallable).toBe(false);
  });

  it('should call prompt() when installApp is called and deferredPrompt exists', async () => {
    Platform.OS = 'web';
    const mockPrompt = jest.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    await act(async () => {
      const event = {
        preventDefault: jest.fn(),
        prompt: mockPrompt,
        userChoice: mockUserChoice,
      };
      eventListeners['beforeinstallprompt']?.forEach(cb => cb(event));
    });

    await act(async () => {
      await hookValue!.installApp();
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should show instructions on iOS when no prompt is available', async () => {
    Platform.OS = 'web';
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    await act(async () => {
      await hookValue!.installApp();
    });

    expect(hookValue!.showInstructions).toBe(true);
  });

  it('should alert on non-iOS when no prompt is available', async () => {
    Platform.OS = 'web';
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    
    let hookValue: PWAInstallValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(hookValue).not.toBeNull();
    });

    await act(async () => {
      await hookValue!.installApp();
    });

    expect(hookValue!.showInstructions).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(i18n.t('settings.install.error'));
    alertSpy.mockRestore();
  });
});
