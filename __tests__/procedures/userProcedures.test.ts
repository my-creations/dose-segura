import { BUILTIN_CVP_ID, builtinProcedures } from '@/procedures/builtin';
import {
  CATALOG_MIGRATION_KEY,
  CATALOG_MIGRATION_VALUE,
  STORAGE_KEY,
  parseProcedures,
} from '@/procedures/procedures';
import { createUserProceduresWorkspace } from '@/procedures/userProcedures';
import { createMemoryKeyValueStore } from '@/storage/types';

function waitFor(
  workspace: ReturnType<typeof createUserProceduresWorkspace>,
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (predicate()) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('waitFor timeout'));
    }, timeoutMs);
    const unsubscribe = workspace.subscribe(() => {
      if (predicate()) {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });
  });
}

async function waitForStored(
  store: ReturnType<typeof createMemoryKeyValueStore>,
  assertion: (users: ReturnType<typeof parseProcedures>) => boolean,
): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    const users = parseProcedures(await store.getItem(STORAGE_KEY));
    if (assertion(users)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('waitForStored timeout');
}

describe('createUserProceduresWorkspace', () => {
  it('loads, migrates catalog templates once, and exposes getters', async () => {
    const store = createMemoryKeyValueStore();
    const workspace = createUserProceduresWorkspace(store, { storageEventTarget: null });
    workspace.start();

    await waitFor(workspace, () => !workspace.getSnapshot().isLoading);

    const snap = workspace.getSnapshot();
    expect(snap.storageReady).toBe(true);
    expect(snap.procedures).toHaveLength(builtinProcedures.length);
    expect(workspace.isTemplateAdopted(BUILTIN_CVP_ID)).toBe(true);
    expect(workspace.getAvailableCatalogTemplates()).toHaveLength(0);
    expect(await store.getItem(CATALOG_MIGRATION_KEY)).toBe(CATALOG_MIGRATION_VALUE);

    workspace.dispose();
  });

  it('creates, updates, deletes, and persists via full-list reconcile', async () => {
    const store = createMemoryKeyValueStore({
      [CATALOG_MIGRATION_KEY]: CATALOG_MIGRATION_VALUE,
    });
    const workspace = createUserProceduresWorkspace(store, { storageEventTarget: null });
    workspace.start();
    await waitFor(workspace, () => workspace.getSnapshot().storageReady);

    const created = workspace.createProcedure({
      title: 'Punção arterial',
      materials: ['Luvas'],
      steps: ['Identificar'],
      attention: ['Protocolo local'],
    });
    expect(created?.id).toMatch(/^user-/);
    expect(workspace.getSnapshot().procedures).toHaveLength(1);

    const updated = workspace.updateProcedure(created!.id, {
      title: 'Punção arterial editada',
      materials: ['Luvas'],
      steps: ['Identificar'],
      attention: ['Protocolo local'],
    });
    expect(updated?.title).toBe('Punção arterial editada');

    await waitForStored(store, (users) => users[0]?.title === 'Punção arterial editada');

    expect(workspace.deleteProcedure(created!.id)).toBe(true);
    expect(workspace.getSnapshot().procedures).toHaveLength(0);

    await waitForStored(store, (users) => users.length === 0);

    workspace.dispose();
  });

  it('merges multi-tab storage events when a target is injected', async () => {
    const listeners = new Map<string, Array<(event: Event) => void>>();
    const target = {
      addEventListener(type: 'storage', listener: (event: Event) => void) {
        const list = listeners.get(type) ?? [];
        list.push(listener);
        listeners.set(type, list);
      },
      removeEventListener(type: 'storage', listener: (event: Event) => void) {
        listeners.set(
          type,
          (listeners.get(type) ?? []).filter((item) => item !== listener),
        );
      },
      dispatch(event: Event) {
        for (const listener of listeners.get(event.type) ?? []) {
          listener(event);
        }
      },
    };

    const store = createMemoryKeyValueStore({
      [CATALOG_MIGRATION_KEY]: CATALOG_MIGRATION_VALUE,
    });
    const workspace = createUserProceduresWorkspace(store, { storageEventTarget: target });
    workspace.start();
    await waitFor(workspace, () => workspace.getSnapshot().storageReady);

    const remote = [
      {
        id: 'user-from-other-tab',
        title: 'Da outra aba',
        materials: [],
        steps: [],
        attention: [],
        source: 'user' as const,
        updatedAt: '2026-09-02T00:00:00.000Z',
      },
    ];
    const event = new Event('storage');
    Object.assign(event, { key: STORAGE_KEY, newValue: JSON.stringify(remote) });
    target.dispatch(event);

    expect(workspace.getSnapshot().procedures.map((p) => p.id)).toEqual(['user-from-other-tab']);
    workspace.dispose();
    expect(listeners.get('storage') ?? []).toHaveLength(0);
  });
});
