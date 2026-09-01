import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import { CookieConsentProvider, useCookieConsent } from '@/context/CookieConsentContext';

type CookieConsentValue = ReturnType<typeof useCookieConsent>;

const STORAGE_KEY = 'dose_segura_cookie_consent_v1';
const originalWindow = global.window;
const originalPlatformOS = Platform.OS;

describe('CookieConsentContext', () => {
  let storage: Record<string, string> = {};
  let eventListeners: Record<string, ((event?: any) => void)[]> = {};

  function getHookValue(value: CookieConsentValue | null): CookieConsentValue {
    if (!value) {
      throw new Error('Hook value not initialized');
    }
    return value;
  }

  function renderWithHarness(onReady: (value: CookieConsentValue) => void) {
    function TestHarness() {
      const hookValue = useCookieConsent();

      useEffect(() => {
        onReady(hookValue);
      }, [hookValue]);

      return null;
    }

    return render(
      <CookieConsentProvider>
        <TestHarness />
      </CookieConsentProvider>,
    );
  }

  beforeAll(() => {
    const globalAny = global as any;

    delete globalAny.window;
    globalAny.window = {
      localStorage: {
        getItem: jest.fn((key: string) => storage[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete storage[key];
        }),
      },
      addEventListener: jest.fn((event: string, cb: (event?: any) => void) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(cb);
      }),
      removeEventListener: jest.fn((event: string, cb: (event?: any) => void) => {
        if (!eventListeners[event]) {
          return;
        }
        eventListeners[event] = eventListeners[event].filter((listener) => listener !== cb);
      }),
    };
  });

  afterAll(() => {
    const globalAny = global as any;
    globalAny.window = originalWindow;
    Platform.OS = originalPlatformOS;
  });

  beforeEach(() => {
    storage = {};
    eventListeners = {};
    jest.clearAllMocks();
    Platform.OS = 'web';
  });

  it('starts with pending consent when there is no stored value', async () => {
    let hookValue: CookieConsentValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(getHookValue(hookValue).isReady).toBe(true);
    });

    const current = getHookValue(hookValue);
    expect(current.status).toBe('pending');
    expect(current.canUseAdvertisingCookies).toBe(false);
  });

  it('loads previously accepted consent from storage', async () => {
    storage[STORAGE_KEY] = JSON.stringify({
      status: 'accepted',
      updatedAt: '2026-03-08T00:00:00.000Z',
      version: 1,
    });

    let hookValue: CookieConsentValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(getHookValue(hookValue).status).toBe('accepted');
    });

    expect(getHookValue(hookValue).canUseAdvertisingCookies).toBe(true);
  });

  it('persists accepted status after calling acceptAll', async () => {
    let hookValue: CookieConsentValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(getHookValue(hookValue).isReady).toBe(true);
    });

    act(() => {
      getHookValue(hookValue).acceptAll();
    });

    expect(getHookValue(hookValue).status).toBe('accepted');
    expect(getHookValue(hookValue).canUseAdvertisingCookies).toBe(true);
    expect(storage[STORAGE_KEY]).toContain('"status":"accepted"');
  });

  it('persists rejected status and can reset consent to pending', async () => {
    let hookValue: CookieConsentValue | null = null;

    renderWithHarness((value) => {
      hookValue = value;
    });

    await waitFor(() => {
      expect(getHookValue(hookValue).isReady).toBe(true);
    });

    act(() => {
      getHookValue(hookValue).rejectNonEssential();
    });

    expect(getHookValue(hookValue).status).toBe('rejected');
    expect(storage[STORAGE_KEY]).toContain('"status":"rejected"');

    act(() => {
      getHookValue(hookValue).resetConsent();
    });

    expect(getHookValue(hookValue).status).toBe('pending');
    expect(storage[STORAGE_KEY]).toBeUndefined();
  });
});
