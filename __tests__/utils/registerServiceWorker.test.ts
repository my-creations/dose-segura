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
  STALE_CHUNK_RECOVERY_STORAGE_KEY,
  STALE_EXPO_CHUNK_MESSAGE,
  createControllerChangeReloader,
  createStaleExpoChunkErrorHandler,
  isExpoStaticJsUrl,
  promptWaitingWorkerToActivate,
  recoverFromStaleExpoChunk,
  registerServiceWorker,
  resetServiceWorkerReloadGuardsForTests,
  scheduleControlledReload,
  watchRegistrationForWaitingWorker,
} from '@/utils/registerServiceWorker';

describe('registerServiceWorker helpers', () => {
  beforeEach(() => {
    resetServiceWorkerReloadGuardsForTests();
  });

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

  it('shares a single reload between controllerchange and scheduleControlledReload', () => {
    const reload = jest.fn();
    const handler = createControllerChangeReloader({ hadController: true, reload });
    expect(scheduleControlledReload(reload)).toBe(true);
    handler();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('detects Expo hashed static JS URLs including [id] chunks', () => {
    expect(
      isExpoStaticJsUrl(
        'https://example.com/dose-segura/_expo/static/js/web/[id]-58a050af.js',
        '/dose-segura',
      ),
    ).toBe(true);
    expect(
      isExpoStaticJsUrl(
        'https://example.com/dose-segura/_expo/static/js/web/%5Bid%5D-58a050af.js',
        '/dose-segura',
      ),
    ).toBe(true);
    expect(
      isExpoStaticJsUrl('https://example.com/dose-segura/meds-full.json', '/dose-segura'),
    ).toBe(false);
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

describe('recoverFromStaleExpoChunk', () => {
  beforeEach(() => {
    resetServiceWorkerReloadGuardsForTests();
  });

  it('unregisters SW, deletes caches, and reloads once while online', async () => {
    const reload = jest.fn();
    const unregister = jest.fn().mockResolvedValue(true);
    const deleteCache = jest.fn().mockResolvedValue(true);
    const storage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
    };

    const recovered = await recoverFromStaleExpoChunk({
      reload,
      online: true,
      sessionStorage: storage,
      getRegistrations: async () => [{ unregister } as unknown as ServiceWorkerRegistration],
      cachesKeys: async () => ['dose-segura-old', 'dose-segura-new'],
      deleteCache,
    });

    expect(recovered).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      STALE_CHUNK_RECOVERY_STORAGE_KEY,
      expect.any(String),
    );
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledWith('dose-segura-old');
    expect(deleteCache).toHaveBeenCalledWith('dose-segura-new');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not recover when offline', async () => {
    const reload = jest.fn();
    const recovered = await recoverFromStaleExpoChunk({
      reload,
      online: false,
      sessionStorage: { getItem: () => null, setItem: jest.fn() },
      getRegistrations: async () => [],
      cachesKeys: async () => [],
      deleteCache: async () => true,
    });
    expect(recovered).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('runs at most once per tab session', async () => {
    const reload = jest.fn();
    const storage = {
      getItem: jest.fn().mockReturnValueOnce(null).mockReturnValue('1'),
      setItem: jest.fn(),
    };

    await recoverFromStaleExpoChunk({
      reload,
      online: true,
      sessionStorage: storage,
      getRegistrations: async () => [],
      cachesKeys: async () => [],
      deleteCache: async () => true,
    });
    resetServiceWorkerReloadGuardsForTests();
    const second = await recoverFromStaleExpoChunk({
      reload,
      online: true,
      sessionStorage: storage,
      getRegistrations: async () => [],
      cachesKeys: async () => [],
      deleteCache: async () => true,
    });

    expect(second).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('suppresses controllerchange reload during recovery to avoid loops', async () => {
    const reload = jest.fn();
    const handler = createControllerChangeReloader({ hadController: true, reload });

    await recoverFromStaleExpoChunk({
      reload,
      online: true,
      sessionStorage: { getItem: () => null, setItem: jest.fn() },
      getRegistrations: async () => [],
      cachesKeys: async () => [],
      deleteCache: async () => true,
    });

    handler();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('triggers recovery from capture-phase script error on expo static JS', async () => {
    const reload = jest.fn();
    const unregister = jest.fn().mockResolvedValue(true);
    const deleteCache = jest.fn().mockResolvedValue(true);
    const storage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
    };
    const handler = createStaleExpoChunkErrorHandler({
      reload,
      basePath: '/dose-segura',
      online: true,
      recovery: {
        sessionStorage: storage,
        getRegistrations: async () => [{ unregister } as unknown as ServiceWorkerRegistration],
        cachesKeys: async () => ['stale-cache'],
        deleteCache,
      },
    });

    await handler({
      target: {
        src: 'https://example.com/dose-segura/_expo/static/js/web/[id]-deadbeef.js',
      },
    } as unknown as Event);

    expect(storage.setItem).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    expect(deleteCache).toHaveBeenCalledWith('stale-cache');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('registerServiceWorker', () => {
  const originalPlatform = Platform.OS;
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    resetServiceWorkerReloadGuardsForTests();
  });

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
    const windowAddEventListener = jest.fn();

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: windowAddEventListener,
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
    expect(addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(windowAddEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);

    await Promise.resolve();
    expect(update).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(windowAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('recovers once when the SW posts STALE_EXPO_CHUNK', async () => {
    Platform.OS = 'web';
    (global as { __DEV__?: boolean }).__DEV__ = false;

    const reload = jest.fn();
    const update = jest.fn().mockResolvedValue(undefined);
    const registration = {
      update,
      waiting: null,
      installing: null,
      addEventListener: jest.fn(),
      unregister: jest.fn().mockResolvedValue(true),
    };
    const register = jest.fn().mockResolvedValue(registration);
    const swListeners: Record<string, (event: MessageEvent) => void> = {};
    const storageMap = new Map<string, string>();

    Object.defineProperty(global, 'window', {
      value: {
        addEventListener: jest.fn(),
        setInterval: jest.fn().mockReturnValue(0),
        location: { reload },
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
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storageMap.set(key, value);
        },
      },
      configurable: true,
    });
    Object.defineProperty(global, 'caches', {
      value: {
        keys: async () => ['dose-segura-stale'],
        delete: jest.fn().mockResolvedValue(true),
      },
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true,
        serviceWorker: {
          register,
          controller: {},
          addEventListener: (type: string, cb: (event: MessageEvent) => void) => {
            swListeners[type] = cb;
          },
          getRegistrations: async () => [registration],
        },
      },
      configurable: true,
    });

    registerServiceWorker();
    expect(swListeners.message).toBeTruthy();

    swListeners.message({
      data: { type: STALE_EXPO_CHUNK_MESSAGE, url: '/dose-segura/_expo/static/js/web/[id]-old.js' },
    } as MessageEvent);

    // Message handler kicks off async recovery without returning the promise.
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(registration.unregister).toHaveBeenCalled();
    expect(caches.delete).toHaveBeenCalledWith('dose-segura-stale');
    expect(reload).toHaveBeenCalledTimes(1);
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
