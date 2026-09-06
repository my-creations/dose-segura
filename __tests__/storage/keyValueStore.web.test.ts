import { createKeyValueStore } from '@/storage/keyValueStore.web';

function mockLocalStorage(impl: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: impl,
  });
}

describe('keyValueStore.web', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, 'localStorage', original);
    }
    jest.restoreAllMocks();
  });

  it('reads and writes values through localStorage', async () => {
    const data = new Map<string, string>();
    mockLocalStorage({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, String(value));
      },
    });

    const store = createKeyValueStore();
    await expect(store.getItem('missing')).resolves.toBeNull();
    await store.setItem('k', 'v');
    await expect(store.getItem('k')).resolves.toBe('v');
  });

  it('rejects when localStorage.setItem throws instead of swallowing the failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });

    const store = createKeyValueStore();
    const pending = store.setItem('@dose_segura_procedures', '[]');
    await expect(pending).rejects.toThrow('QuotaExceededError');
    await expect(pending).rejects.toBeInstanceOf(Error);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('does not resolve setItem after a quota or security exception', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error('The operation is insecure');
      },
    });

    const store = createKeyValueStore();
    let settled: 'resolved' | 'rejected' | 'pending' = 'pending';
    await store
      .setItem('k', 'v')
      .then(() => {
        settled = 'resolved';
      })
      .catch(() => {
        settled = 'rejected';
      });

    expect(settled).toBe('rejected');
  });

  it('rejects when localStorage.getItem throws instead of swallowing the failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
    });

    const store = createKeyValueStore();
    const pending = store.getItem('k');
    await expect(pending).rejects.toThrow('blocked');
    await expect(pending).rejects.toBeInstanceOf(Error);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('does not resolve getItem after a security exception', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalStorage({
      getItem: () => {
        throw new Error('The operation is insecure');
      },
      setItem: () => {},
    });

    const store = createKeyValueStore();
    let settled: 'resolved' | 'rejected' | 'pending' = 'pending';
    await store
      .getItem('k')
      .then(() => {
        settled = 'resolved';
      })
      .catch(() => {
        settled = 'rejected';
      });

    expect(settled).toBe('rejected');
  });

  it('returns null from getItem when localStorage is unavailable', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    });

    const store = createKeyValueStore();
    await expect(store.getItem('k')).resolves.toBeNull();
  });
});
