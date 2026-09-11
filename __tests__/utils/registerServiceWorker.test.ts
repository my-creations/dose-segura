import { Platform } from 'react-native';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      experiments: {
        baseUrl: '/dose-segura',
      },
    },
  },
}));

import { registerServiceWorker } from '@/utils/registerServiceWorker';

describe('registerServiceWorker', () => {
  const originalPlatform = Platform.OS;
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    Platform.OS = originalPlatform;
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  it('does nothing on native platforms', () => {
    Platform.OS = 'ios';
    const register = jest.fn();
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: { register } },
      configurable: true,
    });

    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the production SW under /dose-segura/ on web', () => {
    Platform.OS = 'web';
    (global as { __DEV__?: boolean }).__DEV__ = false;

    const register = jest.fn().mockResolvedValue({
      update: jest.fn().mockResolvedValue(undefined),
    });

    Object.defineProperty(global, 'window', {
      value: { addEventListener: jest.fn() },
      configurable: true,
    });
    Object.defineProperty(global, 'document', {
      value: { readyState: 'complete' },
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: { register } },
      configurable: true,
    });

    registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/dose-segura/sw.js', { scope: '/dose-segura/' });
  });

  it('skips registration while __DEV__ is true', () => {
    Platform.OS = 'web';
    (global as { __DEV__?: boolean }).__DEV__ = true;

    const register = jest.fn();
    Object.defineProperty(global, 'window', {
      value: { addEventListener: jest.fn() },
      configurable: true,
    });
    Object.defineProperty(global, 'document', {
      value: { readyState: 'complete' },
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: { register } },
      configurable: true,
    });

    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });
});
