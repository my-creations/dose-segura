import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type CookieConsentStatus = 'pending' | 'accepted' | 'rejected';

interface StoredConsent {
  status: Exclude<CookieConsentStatus, 'pending'>;
  updatedAt: string;
  version: number;
}

interface CookieConsentContextData {
  isReady: boolean;
  status: CookieConsentStatus;
  canUseAdvertisingCookies: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  resetConsent: () => void;
}

const COOKIE_CONSENT_STORAGE_KEY = 'dose_segura_cookie_consent_v1';
const COOKIE_CONSENT_VERSION = 1;

const CookieConsentContext = createContext<CookieConsentContextData | undefined>(undefined);

function getBrowserStorage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function parseStoredConsent(raw: string | null): StoredConsent | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (
      parsed.status &&
      (parsed.status === 'accepted' || parsed.status === 'rejected') &&
      typeof parsed.updatedAt === 'string'
    ) {
      return {
        status: parsed.status,
        updatedAt: parsed.updatedAt,
        version:
          typeof parsed.version === 'number' && parsed.version > 0
            ? parsed.version
            : COOKIE_CONSENT_VERSION,
      };
    }
  } catch (error) {
    console.error('Failed to parse stored cookie consent:', error);
  }

  return null;
}

function persistConsent(status: Exclude<CookieConsentStatus, 'pending'>) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  const payload: StoredConsent = {
    status,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };

  storage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CookieConsentStatus>(() => {
    const storage = getBrowserStorage();
    const stored = parseStoredConsent(storage?.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? null);
    return stored?.status ?? 'pending';
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_STORAGE_KEY) {
        return;
      }

      const updated = parseStoredConsent(event.newValue);
      setStatus(updated?.status ?? 'pending');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value = useMemo<CookieConsentContextData>(() => {
    return {
      isReady: true,
      status,
      canUseAdvertisingCookies: status === 'accepted',
      acceptAll: () => {
        setStatus('accepted');
        persistConsent('accepted');
      },
      rejectNonEssential: () => {
        setStatus('rejected');
        persistConsent('rejected');
      },
      resetConsent: () => {
        const storage = getBrowserStorage();
        storage?.removeItem(COOKIE_CONSENT_STORAGE_KEY);
        setStatus('pending');
      },
    };
  }, [status]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}
