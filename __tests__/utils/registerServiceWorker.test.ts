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

import {
  createControllerChangeReloader,
  promptWaitingWorkerToActivate,
  registerServiceWorker,
  watchRegistrationForWaitingWorker,
} from '@/utils/registerServiceWorker';

describe('registerServiceWorker helpers', () => {
  it('posts SKIP_WAITING to a waiting worker', () => {
    const postMessage = jest.fn();
    promptWaitingWorkerToActivate({
      waiting: { postMessage } as unknown as ServiceWorker,
    });
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('no-ops when no waiting worker', () => {
    expect(() => promptWaitingWorkerToActivate({ waiting: null })).not.toThrow();
  });

  it('reloads once on controllerchange when a controller already existed', () => {
    const reload = jest.fn();
    const handler = createControllerChangeReloader({ hadController: true, reload });
    handler();
    handler();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload on first install (no prior controller)', () => {
    const reload = jest.fn();
    const handler = createControllerChangeReloader({ hadController: false, reload });
    handler();
    expect(reload).not.toHaveBeenCalled();
  });

  it('nudges waiting worker when updatefound installs', () => {
    const postMessage = jest.fn();
    const installingListeners: Record<string, () => void> = {};
    const installing = {
      state: 'installing',
      addEventListener: jest.fn((event: string, cb: () => void) => {
        installingListeners[event] = cb;
      }),
    };
    const registration = {
      waiting: null as ServiceWorker | null,
      installing: installing as unknown as ServiceWorker,
      addEventListener: jest.fn((event: string, cb: () => void) => {
        if (event === 'updatefound') {
          cb();
        }
      }),
    };

    watchRegistrationForWaitingWorker(registration as unknown as ServiceWorkerRegistration);

    expect(registration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
    expect(installing.addEventListener).toHaveBeenCalledWith('statechange', expect.any(Function));

    registration.waiting = { postMessage } as unknown as ServiceWorker;
    installing.state = 'installed';
    installingListeners.statechange();

    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});

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

  it('registers the production SW under /dose-segura/ on web and wires updates', async () => {
    Platform.OS = 'web';
    (global as { __DEV__?: boolean }).__DEV__ = false;

    const update = jest.fn().mockResolvedValue(undefined);
    const registration = {
      update,
      waiting: null,
      installing: null,
      addEventListener: jest.fn(),
    };
    const register = jest.fn().mockResolvedValue(registration);
    const addEventListener = jest.fn();
    const setIntervalSpy = jest.fn().mockReturnValue(0);

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: jest.fn(),
        setInterval: setIntervalSpy,
        location: { reload: jest.fn() },
      },
      configurable: true,
    });
    Object.defineProperty(global, 'document', {
      value: {
        readyState: 'complete',
        visibilityState: 'visible',
        addEventListener: jest.fn(),
      },
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register,
          controller: {},
          addEventListener,
        },
      },
      configurable: true,
    });

    registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/dose-segura/sw.js', { scope: '/dose-segura/' });
    expect(addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));

    await Promise.resolve();
    expect(update).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
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
