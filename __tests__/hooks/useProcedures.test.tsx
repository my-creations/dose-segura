import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ProceduresProvider, useProcedures } from '@/context/ProceduresContext';
import { BUILTIN_CVP_ID, builtinProcedures } from '@/procedures/builtin';
import { STORAGE_KEY, parseProcedures } from '@/procedures/procedures';
import { createKeyValueStore as createWebKeyValueStore } from '@/storage/keyValueStore.web';
import { createMemoryKeyValueStore, type KeyValueStore } from '@/storage/types';
import type { Procedure } from '@/types/procedure';
import i18n from '@/utils/i18n';

function textOf(testId: string): string {
  const children = screen.getByTestId(testId).props.children;
  return children == null ? '' : String(children);
}

const validDraft = {
  title: 'Punção arterial',
  materials: ['Luvas'],
  steps: ['Identificar o doente'],
  attention: ['Validar com o protocolo da instituição'],
};

let lastDuplicate: Procedure | null = null;
let lastCreate: Procedure | null = null;
let lastUpdate: Procedure | null = null;
let lastDelete: boolean | null = null;

function ProceduresProbe() {
  const {
    procedures,
    isLoading,
    storageReady,
    lastError,
    getProcedure,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    duplicateProcedure,
    search,
  } = useProcedures();

  const userCount = procedures.filter((procedure) => procedure.source === 'user').length;
  const cvp = getProcedure(BUILTIN_CVP_ID);

  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="storage-ready">{storageReady ? 'ready' : 'blocked'}</Text>
      <Text testID="ids">{procedures.map((procedure) => procedure.id).join(',')}</Text>
      <Text testID="user-count">{String(userCount)}</Text>
      <Text testID="cvp-title">{cvp?.title ?? ''}</Text>
      <Text testID="last-error">{lastError ?? ''}</Text>
      <Text testID="last-duplicate-id">{lastDuplicate?.id ?? ''}</Text>
      <Text testID="last-duplicate-title">{lastDuplicate?.title ?? ''}</Text>
      <Text testID="last-duplicate-origin">{lastDuplicate?.originId ?? ''}</Text>
      <Text testID="last-create-id">{lastCreate?.id ?? ''}</Text>
      <Text testID="last-create-title">{lastCreate?.title ?? ''}</Text>
      <Text testID="last-update-id">{lastUpdate?.id ?? ''}</Text>
      <Text testID="last-delete">{lastDelete == null ? '' : lastDelete ? 'true' : 'false'}</Text>
      <Text testID="first-user-title">
        {procedures.find((procedure) => procedure.source === 'user')?.title ?? ''}
      </Text>
      <Text testID="search-sng">
        {search('sondagem')
          .map((procedure) => procedure.id)
          .join(',')}
      </Text>
      <Text testID="search-cvp-padded">
        {search('  cateterismo  ')
          .map((procedure) => procedure.id)
          .join(',')}
      </Text>
      <Text testID="search-empty">{String(search('   ').length)}</Text>
      <Text testID="search-blank">{String(search('').length)}</Text>
      <Text testID="search-unknown">{String(search('inexistente-xyz').length)}</Text>
      <Pressable
        testID="create"
        onPress={() => {
          lastCreate = createProcedure(validDraft);
        }}
      >
        <Text>create</Text>
      </Pressable>
      <Pressable
        testID="create-invalid"
        onPress={() => {
          lastCreate = createProcedure({ title: '  ', materials: [], steps: [], attention: [] });
        }}
      >
        <Text>invalid</Text>
      </Pressable>
      <Pressable
        testID="create-blank-lists"
        onPress={() => {
          lastCreate = createProcedure({
            title: 'Só título',
            materials: ['  ', ''],
            steps: ['   '],
            attention: [],
          });
        }}
      >
        <Text>blank-lists</Text>
      </Pressable>
      <Pressable
        testID="update-cvp"
        onPress={() => {
          lastUpdate = updateProcedure(BUILTIN_CVP_ID, {
            title: 'Should not update',
            materials: [],
            steps: [],
            attention: [],
          });
        }}
      >
        <Text>update-cvp</Text>
      </Pressable>
      <Pressable
        testID="delete-cvp"
        onPress={() => {
          lastDelete = deleteProcedure(BUILTIN_CVP_ID);
        }}
      >
        <Text>delete-cvp</Text>
      </Pressable>
      <Pressable
        testID="duplicate-cvp"
        onPress={() => {
          lastDuplicate = duplicateProcedure(BUILTIN_CVP_ID);
        }}
      >
        <Text>duplicate</Text>
      </Pressable>
      <Pressable
        testID="duplicate-missing"
        onPress={() => {
          lastDuplicate = duplicateProcedure('user-missing');
        }}
      >
        <Text>duplicate-missing</Text>
      </Pressable>
      <Pressable
        testID="update-missing"
        onPress={() => {
          lastUpdate = updateProcedure('user-missing', validDraft);
        }}
      >
        <Text>update-missing</Text>
      </Pressable>
      <Pressable
        testID="delete-missing"
        onPress={() => {
          lastDelete = deleteProcedure('user-missing');
        }}
      >
        <Text>delete-missing</Text>
      </Pressable>
      <Pressable
        testID="update-first-user"
        onPress={() => {
          const user = procedures.find((procedure) => procedure.source === 'user');
          if (!user) {
            return;
          }
          lastUpdate = updateProcedure(user.id, {
            title: 'Punção arterial editada',
            materials: ['Luvas', 'Compressas'],
            steps: ['Identificar o doente'],
            attention: ['Validar com o protocolo da instituição'],
          });
        }}
      >
        <Text>update-user</Text>
      </Pressable>
      <Pressable
        testID="delete-first-user"
        onPress={() => {
          const user = procedures.find((procedure) => procedure.source === 'user');
          if (!user) {
            return;
          }
          lastDelete = deleteProcedure(user.id);
        }}
      >
        <Text>delete-user</Text>
      </Pressable>
    </>
  );
}

function renderProcedures(store: KeyValueStore = createMemoryKeyValueStore()) {
  render(
    <ProceduresProvider store={store}>
      <ProceduresProbe />
    </ProceduresProvider>,
  );

  return store;
}

async function waitUntilReady() {
  await waitFor(() => {
    expect(textOf('loading')).toBe('ready');
  });
}

async function waitForStored(store: KeyValueStore, assertion: (users: Procedure[]) => void) {
  await waitFor(async () => {
    assertion(parseProcedures(await store.getItem(STORAGE_KEY)));
  });
}

function installWindowStorageEvents() {
  const listeners = new Map<string, Array<(event: Event) => void>>();
  const previousAdd = window.addEventListener;
  const previousRemove = window.removeEventListener;
  const previousDispatch = window.dispatchEvent;

  window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
    const list = listeners.get(type) ?? [];
    if (typeof listener === 'function') {
      list.push(listener);
      listeners.set(type, list);
    }
  }) as typeof window.addEventListener;

  window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.set(
      type,
      (listeners.get(type) ?? []).filter((item) => item !== listener),
    );
  }) as typeof window.removeEventListener;

  window.dispatchEvent = ((event: Event) => {
    for (const listener of listeners.get(event.type) ?? []) {
      listener(event);
    }
    return true;
  }) as typeof window.dispatchEvent;

  return () => {
    window.addEventListener = previousAdd;
    window.removeEventListener = previousRemove;
    window.dispatchEvent = previousDispatch;
  };
}

describe('useProcedures', () => {
  beforeEach(() => {
    lastCreate = null;
    lastDuplicate = null;
    lastUpdate = null;
    lastDelete = null;
  });

  it('loads built-in starters even with empty storage', async () => {
    renderProcedures();
    await waitUntilReady();

    expect(textOf('cvp-title')).toBe('Cateterismo venoso periférico');
    expect(textOf('user-count')).toBe('0');
    expect(textOf('ids')).toContain(BUILTIN_CVP_ID);
    expect(textOf('search-sng')).toContain('builtin-sondagem-nasogastrica');
  });

  it('loads user procedures from storage and keeps built-ins read-only', async () => {
    const stored: Procedure = {
      id: 'user-stored',
      title: 'Meu procedimento',
      materials: ['Luvas'],
      steps: ['Documentar'],
      attention: ['Protocolo local'],
      source: 'user',
      updatedAt: '2026-09-02T00:00:00.000Z',
    };
    const store = createMemoryKeyValueStore({
      [STORAGE_KEY]: JSON.stringify([stored, builtinProcedures[0]]),
    });

    renderProcedures(store);
    await waitUntilReady();

    expect(textOf('ids')).toContain('user-stored');
    expect(textOf('cvp-title')).toBe('Cateterismo venoso periférico');
    expect(textOf('user-count')).toBe('1');
  });

  it('creates, updates, duplicates and deletes user procedures while persisting only user copies', async () => {
    const store = createMemoryKeyValueStore();
    renderProcedures(store);
    await waitUntilReady();

    fireEvent.press(screen.getByTestId('create-invalid'));
    expect(textOf('user-count')).toBe('0');
    expect(lastCreate).toBeNull();

    fireEvent.press(screen.getByTestId('create'));
    expect(textOf('user-count')).toBe('1');
    expect(lastCreate?.id).toMatch(/^user-/);
    expect(textOf('ids')).toContain(lastCreate?.id ?? '');

    fireEvent.press(screen.getByTestId('update-first-user'));
    expect(textOf('ids')).toContain('user-');
    expect(lastUpdate?.title).toBe('Punção arterial editada');

    await waitForStored(store, (created) => {
      expect(created).toHaveLength(1);
      expect(created[0]?.title).toBe('Punção arterial editada');
      expect(created[0]?.source).toBe('user');
      expect(created.some((procedure) => procedure.id === BUILTIN_CVP_ID)).toBe(false);
    });

    fireEvent.press(screen.getByTestId('update-cvp'));
    fireEvent.press(screen.getByTestId('delete-cvp'));
    expect(lastUpdate).toBeNull();
    expect(lastDelete).toBe(false);
    expect(textOf('cvp-title')).toBe('Cateterismo venoso periférico');

    fireEvent.press(screen.getByTestId('duplicate-cvp'));
    expect(textOf('user-count')).toBe('2');

    fireEvent.press(screen.getByTestId('delete-first-user'));
    expect(textOf('user-count')).toBe('1');
    expect(textOf('last-delete')).toBe('true');

    await waitForStored(store, (persisted) => {
      expect(persisted.every((procedure) => procedure.source === 'user')).toBe(true);
      expect(persisted.every((procedure) => procedure.id.startsWith('user-'))).toBe(true);
    });
  });

  it('returns a duplicate whose id is present in state', async () => {
    renderProcedures();
    await waitUntilReady();

    fireEvent.press(screen.getByTestId('duplicate-cvp'));

    const duplicateId = textOf('last-duplicate-id');
    expect(duplicateId).toMatch(/^user-/);
    expect(textOf('ids')).toContain(duplicateId);
    expect(textOf('last-duplicate-title')).toBe('Cateterismo venoso periférico (cópia)');
    expect(textOf('last-duplicate-origin')).toBe(BUILTIN_CVP_ID);
    expect(textOf('first-user-title')).toBe('Cateterismo venoso periférico (cópia)');
    expect(lastDuplicate?.source).toBe('user');
    expect(lastDuplicate?.id).toBe(duplicateId);
  });

  it('does not persist a builtins-only snapshot while the initial load is in flight', async () => {
    const storedUser: Procedure = {
      id: 'user-stored',
      title: 'Meu procedimento',
      materials: ['Luvas'],
      steps: ['Documentar'],
      attention: ['Protocolo local'],
      source: 'user',
      updatedAt: '2026-09-02T00:00:00.000Z',
    };
    let persisted: string | null = JSON.stringify([storedUser]);
    let release: ((value: string | null) => void) | undefined;
    let loadStarted = false;
    const setItem = jest.fn(async (_key: string, value: string) => {
      persisted = value;
    });
    const store: KeyValueStore = {
      getItem: () => {
        if (!loadStarted) {
          loadStarted = true;
          return new Promise((resolve) => {
            release = resolve;
          });
        }
        return Promise.resolve(persisted);
      },
      setItem,
    };

    renderProcedures(store);
    expect(textOf('loading')).toBe('loading');

    fireEvent.press(screen.getByTestId('create'));
    fireEvent.press(screen.getByTestId('duplicate-cvp'));
    fireEvent.press(screen.getByTestId('update-first-user'));
    fireEvent.press(screen.getByTestId('delete-first-user'));
    fireEvent.press(screen.getByTestId('update-missing'));
    fireEvent.press(screen.getByTestId('delete-missing'));
    fireEvent.press(screen.getByTestId('duplicate-missing'));

    expect(lastCreate).toBeNull();
    expect(lastDuplicate).toBeNull();
    expect(lastUpdate).toBeNull();
    expect(lastDelete).toBe(false);
    expect(textOf('user-count')).toBe('0');
    expect(textOf('last-create-id')).toBe('');
    expect(setItem).not.toHaveBeenCalled();

    if (!release) {
      throw new Error('getItem was not called');
    }
    release(persisted);
    await waitUntilReady();

    expect(textOf('ids')).toContain('user-stored');
    expect(textOf('user-count')).toBe('1');
    expect(textOf('first-user-title')).toBe('Meu procedimento');
    expect(setItem).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('create'));
    expect(textOf('user-count')).toBe('2');
    await waitFor(() => {
      expect(setItem).toHaveBeenCalled();
    });

    const written = JSON.parse(String(setItem.mock.calls[0]?.[1] ?? '[]')) as Procedure[];
    expect(written.some((procedure) => procedure.id === 'user-stored')).toBe(true);
    expect(written.every((procedure) => procedure.source === 'user')).toBe(true);
    expect(written.some((procedure) => procedure.id === BUILTIN_CVP_ID)).toBe(false);
  });

  it('blocks writes after the initial load fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const setItem = jest.fn(async () => {});
    const store: KeyValueStore = {
      getItem: async () => {
        throw new Error('disk unreadable');
      },
      setItem,
    };

    try {
      renderProcedures(store);
      await waitUntilReady();

      expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      expect(textOf('storage-ready')).toBe('blocked');
      expect(textOf('cvp-title')).toBe('Cateterismo venoso periférico');
      expect(textOf('user-count')).toBe('0');

      fireEvent.press(screen.getByTestId('create'));
      fireEvent.press(screen.getByTestId('duplicate-cvp'));
      fireEvent.press(screen.getByTestId('update-first-user'));
      fireEvent.press(screen.getByTestId('delete-first-user'));

      expect(lastCreate).toBeNull();
      expect(lastDuplicate).toBeNull();
      expect(lastUpdate).toBeNull();
      expect(lastDelete).toBeNull();
      expect(textOf('user-count')).toBe('0');
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('persists a create onto the latest stored user procedures, not a stale tab snapshot', async () => {
    const otherTabUser: Procedure = {
      id: 'user-from-other-tab',
      title: 'Da outra aba',
      materials: ['Luvas'],
      steps: ['Documentar'],
      attention: ['Protocolo local'],
      source: 'user',
      updatedAt: '2026-09-02T00:00:00.000Z',
    };
    const store = createMemoryKeyValueStore();
    renderProcedures(store);
    await waitUntilReady();

    await store.setItem(STORAGE_KEY, JSON.stringify([otherTabUser]));
    fireEvent.press(screen.getByTestId('create'));
    expect(lastCreate?.id).toMatch(/^user-/);

    await waitForStored(store, (persisted) => {
      expect(persisted.some((procedure) => procedure.id === 'user-from-other-tab')).toBe(true);
      expect(persisted.some((procedure) => procedure.id === lastCreate?.id)).toBe(true);
      expect(persisted.every((procedure) => procedure.source === 'user')).toBe(true);
      expect(persisted.some((procedure) => procedure.id === BUILTIN_CVP_ID)).toBe(false);
    });
  });

  it('merges another tab write from a storage event', async () => {
    const restore = installWindowStorageEvents();
    try {
      const view = render(
        <ProceduresProvider>
          <ProceduresProbe />
        </ProceduresProvider>,
      );
      await waitUntilReady();

      const fromOtherTab: Procedure = {
        id: 'user-from-event',
        title: 'Escrito noutra aba',
        materials: ['Luvas'],
        steps: ['Documentar'],
        attention: ['Protocolo local'],
        source: 'user',
        updatedAt: '2026-09-02T00:00:00.000Z',
      };
      const event = new Event('storage');
      Object.assign(event, {
        key: STORAGE_KEY,
        newValue: JSON.stringify([fromOtherTab]),
      });
      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(textOf('ids')).toContain('user-from-event');
        expect(textOf('user-count')).toBe('1');
        expect(textOf('first-user-title')).toBe('Escrito noutra aba');
      });
      view.unmount();
    } finally {
      restore();
    }
  });

  it('preserves pending local creates across storage events', async () => {
    const restore = installWindowStorageEvents();
    try {
      const inner = createMemoryKeyValueStore();
      let blockPersistGets = false;
      const pendingGets: Array<(value: string | null) => void> = [];
      const store: KeyValueStore = {
        getItem: async (key) => {
          if (blockPersistGets) {
            return new Promise((resolve) => {
              pendingGets.push(resolve);
            });
          }
          return inner.getItem(key);
        },
        setItem: async (key, value) => {
          await inner.setItem(key, value);
        },
      };

      renderProcedures(store);
      await waitUntilReady();

      blockPersistGets = true;
      fireEvent.press(screen.getByTestId('create'));
      const pendingId = lastCreate?.id;
      expect(pendingId).toMatch(/^user-/);
      expect(textOf('user-count')).toBe('1');
      await waitFor(() => {
        expect(pendingGets.length).toBeGreaterThan(0);
      });

      const fromOtherTab: Procedure = {
        id: 'user-from-event-pending',
        title: 'Escrito noutra aba durante create',
        materials: ['Luvas'],
        steps: ['Documentar'],
        attention: ['Protocolo local'],
        source: 'user',
        updatedAt: '2026-09-02T00:00:00.000Z',
      };
      const event = new Event('storage');
      Object.assign(event, {
        key: STORAGE_KEY,
        newValue: JSON.stringify([fromOtherTab]),
      });
      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(textOf('ids')).toContain(pendingId!);
        expect(textOf('ids')).toContain('user-from-event-pending');
        expect(textOf('user-count')).toBe('2');
      });

      const diskSnapshot = await inner.getItem(STORAGE_KEY);
      blockPersistGets = false;
      for (const resolve of pendingGets.splice(0)) {
        resolve(diskSnapshot);
      }

      await waitForStored(store, (persisted) => {
        expect(persisted.some((procedure) => procedure.id === pendingId)).toBe(true);
        expect(persisted.some((procedure) => procedure.id === 'user-from-event-pending')).toBe(
          true,
        );
      });
    } finally {
      restore();
    }
  });

  it('honors another tab delete from a storage event', async () => {
    const restore = installWindowStorageEvents();
    try {
      const stored: Procedure = {
        id: 'user-to-delete-elsewhere',
        title: 'Vai ser apagado noutra aba',
        materials: ['Luvas'],
        steps: ['Documentar'],
        attention: ['Protocolo local'],
        source: 'user',
        updatedAt: '2026-09-02T00:00:00.000Z',
      };
      const store = createMemoryKeyValueStore({
        [STORAGE_KEY]: JSON.stringify([stored]),
      });
      renderProcedures(store);
      await waitUntilReady();
      expect(textOf('ids')).toContain('user-to-delete-elsewhere');
      expect(textOf('user-count')).toBe('1');

      await store.setItem(STORAGE_KEY, '[]');
      const event = new Event('storage');
      Object.assign(event, {
        key: STORAGE_KEY,
        newValue: '[]',
      });
      act(() => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(textOf('ids')).not.toContain('user-to-delete-elsewhere');
        expect(textOf('user-count')).toBe('0');
      });

      fireEvent.press(screen.getByTestId('create'));
      expect(lastCreate?.id).toMatch(/^user-/);

      await waitForStored(store, (persisted) => {
        expect(persisted.some((procedure) => procedure.id === 'user-to-delete-elsewhere')).toBe(
          false,
        );
        expect(persisted.some((procedure) => procedure.id === lastCreate?.id)).toBe(true);
      });
    } finally {
      restore();
    }
  });

  it('rejects missing ids and does not create from an empty title', async () => {
    renderProcedures();
    await waitUntilReady();

    fireEvent.press(screen.getByTestId('create-invalid'));
    fireEvent.press(screen.getByTestId('update-missing'));
    fireEvent.press(screen.getByTestId('delete-missing'));
    fireEvent.press(screen.getByTestId('duplicate-missing'));

    expect(lastCreate).toBeNull();
    expect(lastUpdate).toBeNull();
    expect(lastDuplicate).toBeNull();
    expect(lastDelete).toBe(false);
    expect(textOf('user-count')).toBe('0');
  });

  it('strips blank list items instead of persisting empty strings', async () => {
    const store = createMemoryKeyValueStore();
    renderProcedures(store);
    await waitUntilReady();

    fireEvent.press(screen.getByTestId('create-blank-lists'));
    expect(lastCreate?.title).toBe('Só título');
    expect(lastCreate?.materials).toEqual([]);
    expect(lastCreate?.steps).toEqual([]);
    expect(lastCreate?.attention).toEqual([]);
    expect(textOf('user-count')).toBe('1');

    await waitForStored(store, (persisted) => {
      expect(persisted[0]?.materials).toEqual([]);
      expect(persisted[0]?.steps).toEqual([]);
    });
  });

  it('searches by padded title, returns all on blank query, and nothing for unknown text', async () => {
    renderProcedures();
    await waitUntilReady();

    expect(textOf('search-cvp-padded')).toContain(BUILTIN_CVP_ID);
    expect(Number(textOf('search-empty'))).toBe(builtinProcedures.length);
    expect(Number(textOf('search-blank'))).toBe(builtinProcedures.length);
    expect(textOf('search-unknown')).toBe('0');
  });

  it('surfaces persist failure instead of treating save as durable success', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store: KeyValueStore = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full');
      },
    };

    try {
      renderProcedures(store);
      await waitUntilReady();
      expect(textOf('last-error')).toBe('');

      fireEvent.press(screen.getByTestId('create'));
      expect(textOf('user-count')).toBe('1');

      await waitFor(() => {
        expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      });
      expect(textOf('last-error')).toBe('Não foi possível guardar. As alterações podem perder-se.');
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('persists a failed create when a later duplicate succeeds', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const inner = createMemoryKeyValueStore();
    let failNext = true;
    const store: KeyValueStore = {
      getItem: (key) => inner.getItem(key),
      setItem: async (key, value) => {
        if (failNext) {
          failNext = false;
          throw new Error('disk full');
        }
        await inner.setItem(key, value);
      },
    };

    try {
      renderProcedures(store);
      await waitUntilReady();
      fireEvent.press(screen.getByTestId('create'));
      await waitFor(() => {
        expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      });
      expect(textOf('user-count')).toBe('1');
      const createdId = lastCreate?.id;
      expect(createdId).toMatch(/^user-/);

      fireEvent.press(screen.getByTestId('duplicate-cvp'));
      await waitFor(() => {
        expect(textOf('last-error')).toBe('');
      });
      expect(textOf('user-count')).toBe('2');

      await waitForStored(store, (persisted) => {
        expect(persisted.some((procedure) => procedure.id === createdId)).toBe(true);
        expect(persisted.some((procedure) => procedure.id === lastDuplicate?.id)).toBe(true);
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('clears lastError when a queued persist succeeds after a failed one', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const inner = createMemoryKeyValueStore();
    let failures = 0;
    const store: KeyValueStore = {
      getItem: (key) => inner.getItem(key),
      setItem: async (key, value) => {
        if (failures === 0) {
          failures += 1;
          throw new Error('disk full');
        }
        await inner.setItem(key, value);
      },
    };

    try {
      renderProcedures(store);
      await waitUntilReady();
      fireEvent.press(screen.getByTestId('create'));
      fireEvent.press(screen.getByTestId('duplicate-cvp'));
      expect(textOf('user-count')).toBe('2');
      const createdId = lastCreate?.id;
      expect(createdId).toMatch(/^user-/);

      await waitForStored(store, (persisted) => {
        expect(persisted.some((procedure) => procedure.id === createdId)).toBe(true);
        expect(persisted.some((procedure) => procedure.id === lastDuplicate?.id)).toBe(true);
      });
      await waitFor(() => {
        expect(textOf('last-error')).toBe('');
      });
      expect(failures).toBe(1);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('keeps lastError when retrying the full list still fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store: KeyValueStore = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full');
      },
    };

    try {
      renderProcedures(store);
      await waitUntilReady();
      fireEvent.press(screen.getByTestId('create'));
      await waitFor(() => {
        expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      });

      fireEvent.press(screen.getByTestId('duplicate-cvp'));
      expect(textOf('user-count')).toBe('2');
      await waitFor(() => {
        expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('retries persist when storage changes between get and set', async () => {
    const otherTabUser: Procedure = {
      id: 'user-from-other-tab',
      title: 'Da outra aba',
      materials: ['Luvas'],
      steps: ['Documentar'],
      attention: ['Protocolo local'],
      source: 'user',
      updatedAt: '2026-09-02T00:00:00.000Z',
    };
    const inner = createMemoryKeyValueStore();
    let interfereNextGet = false;
    let interfered = false;
    const store: KeyValueStore = {
      getItem: async (key) => {
        if (interfereNextGet && !interfered) {
          interfered = true;
          await inner.setItem(key, JSON.stringify([otherTabUser]));
          return null;
        }
        return inner.getItem(key);
      },
      setItem: async (key, value) => {
        await inner.setItem(key, value);
      },
    };

    renderProcedures(store);
    await waitUntilReady();
    interfereNextGet = true;
    fireEvent.press(screen.getByTestId('create'));
    expect(lastCreate?.id).toMatch(/^user-/);

    await waitForStored(store, (persisted) => {
      expect(persisted.some((procedure) => procedure.id === 'user-from-other-tab')).toBe(true);
      expect(persisted.some((procedure) => procedure.id === lastCreate?.id)).toBe(true);
    });
    expect(interfered).toBe(true);
  });

  it('surfaces a throwing web localStorage.setItem as persist failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const previous = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
    });

    try {
      const store = createWebKeyValueStore();
      await expect(store.setItem(STORAGE_KEY, '[]')).rejects.toThrow('QuotaExceededError');

      renderProcedures(store);
      await waitUntilReady();
      fireEvent.press(screen.getByTestId('create'));
      await waitFor(() => {
        expect(textOf('last-error')).toBe(i18n.t('procedures.persistError'));
      });
    } finally {
      if (previous) {
        Object.defineProperty(window, 'localStorage', previous);
      }
      errorSpy.mockRestore();
    }
  });
});
