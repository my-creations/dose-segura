import { builtinProcedures } from '@/procedures/builtin';
import {
  CATALOG_MIGRATION_KEY,
  CATALOG_MIGRATION_VALUE,
  STORAGE_KEY,
  adoptFromCatalog,
  availableCatalogTemplates,
  createUserProcedureId,
  duplicateAsUserProcedure,
  findCatalogTemplate,
  isCatalogTemplateAdopted,
  mergeLoadedProcedures,
  parseProcedures,
  reconcilePersistedUsers,
  sanitizeDraft,
  searchProcedures,
  seedMissingCatalogTemplates,
  serializeProcedures,
  validateDraft,
} from '@/procedures/procedures';
import type { KeyValueStore } from '@/storage/types';
import type { Procedure, ProcedureDraft } from '@/types/procedure';
import i18n from '@/utils/i18n';

const PERSIST_RETRY_LIMIT = 6;

/** Minimal window-like target for web multi-tab `storage` events. */
export type StorageEventTarget = {
  addEventListener(type: 'storage', listener: (event: Event) => void): void;
  removeEventListener(type: 'storage', listener: (event: Event) => void): void;
};

export interface UserProceduresWorkspaceSnapshot {
  /** Visible Procedures List — user procedures only. */
  procedures: Procedure[];
  isLoading: boolean;
  storageReady: boolean;
  lastError: string | null;
}

export interface CreateUserProceduresWorkspaceOptions {
  /** Procedure Templates used for catalog adopt/migration (defaults to bundled builtins). */
  catalogTemplates?: readonly Procedure[];
  /**
   * Target for web multi-tab `storage` events.
   * Defaults to global `window` when `addEventListener` exists (SSR-safe).
   * Pass `null` to disable; inject a stub in unit tests when needed.
   */
  storageEventTarget?: StorageEventTarget | null;
}

export interface UserProceduresWorkspace {
  /** Bundled / injected Procedure Templates (Template Catalog). */
  readonly catalogTemplates: readonly Procedure[];
  getSnapshot(): UserProceduresWorkspaceSnapshot;
  subscribe(listener: () => void): () => void;
  /** Begin load + multi-tab listener. Idempotent; safe to call again after dispose. */
  start(): void;
  /** Cancel in-flight load and detach multi-tab listener. */
  dispose(): void;
  getProcedure(id: string): Procedure | undefined;
  search(query: string): Procedure[];
  createProcedure(draft: ProcedureDraft): Procedure | null;
  updateProcedure(id: string, draft: ProcedureDraft): Procedure | null;
  deleteProcedure(id: string): boolean;
  duplicateProcedure(id: string): Procedure | null;
  addFromCatalog(templateId: string): Procedure | null;
  getAvailableCatalogTemplates(): Procedure[];
  isTemplateAdopted(templateId: string): boolean;
}

function defaultStorageEventTarget(): StorageEventTarget | null {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return null;
  }
  return window;
}

/**
 * User Procedures Workspace — owns load, catalog migration, optimistic CRUD,
 * CAS full-list reconcile persist, and web multi-tab sync for the Procedures List.
 */
export function createUserProceduresWorkspace(
  store: KeyValueStore,
  options: CreateUserProceduresWorkspaceOptions = {},
): UserProceduresWorkspace {
  const catalogTemplates = options.catalogTemplates ?? builtinProcedures;
  const resolvedStorageTarget =
    options.storageEventTarget === undefined
      ? defaultStorageEventTarget()
      : options.storageEventTarget;

  let procedures: Procedure[] = [];
  let isLoading = true;
  let storageReady = false;
  let lastError: string | null = null;
  let snapshot: UserProceduresWorkspaceSnapshot = {
    procedures,
    isLoading,
    storageReady,
    lastError,
  };

  const listeners = new Set<() => void>();
  const deletedIds = new Set<string>();
  const pendingUpsertIds = new Set<string>();
  let persistChain: Promise<void> = Promise.resolve();
  let loadCancelled = false;
  let started = false;
  let storageListener: ((event: Event) => void) | null = null;

  const emit = () => {
    snapshot = {
      procedures,
      isLoading,
      storageReady,
      lastError,
    };
    for (const listener of listeners) {
      listener();
    }
  };

  const setLastError = (error: string | null) => {
    if (lastError === error) {
      return;
    }
    lastError = error;
    emit();
  };

  const setProcedures = (next: Procedure[]) => {
    procedures = next;
    emit();
  };

  const onStorage = (event: Event) => {
    const key = (event as { key?: unknown }).key;
    if (key !== STORAGE_KEY) {
      return;
    }

    const newValue = (event as { newValue?: unknown }).newValue;
    const raw = typeof newValue === 'string' ? newValue : null;
    const fromDisk = parseProcedures(raw);
    const merged = mergeLoadedProcedures(catalogTemplates, fromDisk, procedures, pendingUpsertIds);
    const next =
      deletedIds.size === 0
        ? merged
        : merged.filter(
            (procedure) => procedure.source !== 'user' || !deletedIds.has(procedure.id),
          );
    setProcedures(next);
  };

  const attachStorageListener = () => {
    if (!resolvedStorageTarget || storageListener) {
      return;
    }
    storageListener = onStorage;
    resolvedStorageTarget.addEventListener('storage', storageListener);
  };

  const detachStorageListener = () => {
    if (!resolvedStorageTarget || !storageListener) {
      return;
    }
    if (typeof resolvedStorageTarget.removeEventListener === 'function') {
      resolvedStorageTarget.removeEventListener('storage', storageListener);
    }
    storageListener = null;
  };

  const loadProcedures = async () => {
    try {
      const raw = await store.getItem(STORAGE_KEY);
      if (loadCancelled) {
        return;
      }

      let fromDisk = parseProcedures(raw);
      const migrationFlag = await store.getItem(CATALOG_MIGRATION_KEY);

      if (migrationFlag !== CATALOG_MIGRATION_VALUE) {
        const seeded = seedMissingCatalogTemplates(fromDisk, catalogTemplates);
        if (seeded !== fromDisk) {
          fromDisk = seeded;
          await store.setItem(STORAGE_KEY, serializeProcedures(fromDisk));
        }
        await store.setItem(CATALOG_MIGRATION_KEY, CATALOG_MIGRATION_VALUE);
      }

      if (loadCancelled) {
        return;
      }

      const next = mergeLoadedProcedures(catalogTemplates, fromDisk, procedures, pendingUpsertIds);
      procedures = next;
      storageReady = true;
      emit();
    } catch (error) {
      console.error('Error loading procedures:', error);
      if (!loadCancelled) {
        lastError = i18n.t('procedures.persistError');
        storageReady = false;
        emit();
      }
    } finally {
      if (!loadCancelled) {
        isLoading = false;
        emit();
      }
    }
  };

  const persistAndTrack = (): Promise<void> => {
    if (!storageReady) {
      return Promise.resolve();
    }

    const run = async () => {
      try {
        for (let attempt = 0; attempt < PERSIST_RETRY_LIMIT; attempt += 1) {
          const raw = await store.getItem(STORAGE_KEY);
          const diskUsers = parseProcedures(raw);
          const intended = procedures.filter((procedure) => procedure.source === 'user');
          const nextUsers = reconcilePersistedUsers(intended, diskUsers, deletedIds);
          const payload = serializeProcedures(nextUsers);

          const latestRaw = await store.getItem(STORAGE_KEY);
          if (latestRaw !== raw) {
            continue;
          }

          await store.setItem(STORAGE_KEY, payload);

          const confirm = await store.getItem(STORAGE_KEY);
          if (confirm === payload) {
            for (const procedure of nextUsers) {
              pendingUpsertIds.delete(procedure.id);
            }
            for (const id of deletedIds) {
              pendingUpsertIds.delete(id);
            }
            setLastError(null);
            return;
          }
        }

        throw new Error('Procedure persist conflict');
      } catch (error) {
        console.error('Error saving procedures:', error);
        setLastError(i18n.t('procedures.persistError'));
      }
    };

    persistChain = persistChain.then(run, run);
    return persistChain;
  };

  const getProcedure = (id: string) => {
    const fromList = procedures.find((procedure) => procedure.id === id);
    if (fromList) {
      return fromList;
    }
    return findCatalogTemplate(id, catalogTemplates);
  };

  const search = (query: string) => searchProcedures(procedures, query);

  const createProcedure = (draft: ProcedureDraft) => {
    if (!storageReady) {
      return null;
    }

    const sanitized = sanitizeDraft(draft);
    if (validateDraft(sanitized)) {
      return null;
    }

    const created: Procedure = {
      id: createUserProcedureId(),
      title: sanitized.title,
      materials: sanitized.materials,
      steps: sanitized.steps,
      attention: sanitized.attention,
      source: 'user',
      updatedAt: new Date().toISOString(),
    };

    pendingUpsertIds.add(created.id);
    setProcedures([...procedures, created]);
    void persistAndTrack();

    return created;
  };

  const updateProcedure = (id: string, draft: ProcedureDraft) => {
    if (!storageReady) {
      return null;
    }

    const sanitized = sanitizeDraft(draft);
    if (validateDraft(sanitized)) {
      return null;
    }

    const existing = procedures.find((procedure) => procedure.id === id);
    if (!existing || existing.source !== 'user') {
      return null;
    }

    const updatedProcedure: Procedure = {
      ...existing,
      title: sanitized.title,
      materials: sanitized.materials,
      steps: sanitized.steps,
      attention: sanitized.attention,
      source: 'user',
      updatedAt: new Date().toISOString(),
    };

    pendingUpsertIds.add(id);
    setProcedures(
      procedures.map((procedure) => (procedure.id === id ? updatedProcedure : procedure)),
    );
    void persistAndTrack();

    return updatedProcedure;
  };

  const deleteProcedure = (id: string) => {
    if (!storageReady) {
      return false;
    }

    const existing = procedures.find((procedure) => procedure.id === id);
    if (!existing || existing.source !== 'user') {
      return false;
    }

    deletedIds.add(id);
    pendingUpsertIds.delete(id);
    setProcedures(procedures.filter((procedure) => procedure.id !== id));
    void persistAndTrack();

    return true;
  };

  const duplicateProcedure = (id: string) => {
    if (!storageReady) {
      return null;
    }

    const source = getProcedure(id);
    if (!source) {
      return null;
    }

    const copy = duplicateAsUserProcedure(source);

    pendingUpsertIds.add(copy.id);
    setProcedures([...procedures, copy]);
    void persistAndTrack();

    return copy;
  };

  const addFromCatalog = (templateId: string) => {
    if (!storageReady) {
      return null;
    }

    const template = findCatalogTemplate(templateId, catalogTemplates);
    if (!template) {
      return null;
    }

    if (isCatalogTemplateAdopted(procedures, template)) {
      return null;
    }

    const adopted = adoptFromCatalog(template);

    pendingUpsertIds.add(adopted.id);
    setProcedures([...procedures, adopted]);
    void persistAndTrack();

    return adopted;
  };

  const getAvailableCatalogTemplates = () =>
    availableCatalogTemplates(catalogTemplates, procedures);

  const isTemplateAdopted = (templateId: string) => {
    const template = findCatalogTemplate(templateId, catalogTemplates);
    if (!template) {
      return false;
    }
    return isCatalogTemplateAdopted(procedures, template);
  };

  return {
    catalogTemplates,

    getSnapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    start() {
      if (started) {
        return;
      }
      started = true;
      loadCancelled = false;
      isLoading = true;
      emit();
      attachStorageListener();
      void loadProcedures();
    },

    dispose() {
      loadCancelled = true;
      started = false;
      detachStorageListener();
    },

    getProcedure,
    search,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    duplicateProcedure,
    addFromCatalog,
    getAvailableCatalogTemplates,
    isTemplateAdopted,
  };
}
