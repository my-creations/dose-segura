import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { builtinProcedures } from '@/procedures/builtin';
import {
  STORAGE_KEY,
  duplicateAsUserProcedure,
  mergeLoadedProcedures,
  parseProcedures,
  sanitizeDraft,
  searchProcedures,
  serializeProcedures,
  validateDraft,
  createUserProcedureId,
  reconcilePersistedUsers,
} from '@/procedures/procedures';
import { keyValueStore } from '@/storage/keyValueStore';
import type { KeyValueStore } from '@/storage/types';
import type { Procedure, ProcedureDraft } from '@/types/procedure';
import i18n from '@/utils/i18n';

const PERSIST_RETRY_LIMIT = 6;

export interface ProceduresContextType {
  procedures: Procedure[];
  isLoading: boolean;
  storageReady: boolean;
  lastError: string | null;
  getProcedure: (id: string) => Procedure | undefined;
  search: (query: string) => Procedure[];
  createProcedure: (draft: ProcedureDraft) => Procedure | null;
  updateProcedure: (id: string, draft: ProcedureDraft) => Procedure | null;
  deleteProcedure: (id: string) => boolean;
  duplicateProcedure: (id: string) => Procedure | null;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

interface ProceduresProviderProps {
  children: React.ReactNode;
  /** Optional store override for tests. */
  store?: KeyValueStore;
}

export function ProceduresProvider({ children, store = keyValueStore }: ProceduresProviderProps) {
  const [procedures, setProcedures] = useState<Procedure[]>(() =>
    mergeLoadedProcedures(builtinProcedures, [], []),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastErrorRef = useRef(lastError);
  const proceduresRef = useRef(procedures);
  const deletedIdsRef = useRef(new Set<string>());
  const pendingUpsertIdsRef = useRef(new Set<string>());
  const persistChainRef = useRef(Promise.resolve());

  const setTrackedLastError = useCallback((error: string | null) => {
    lastErrorRef.current = error;
    setLastError(error);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProcedures() {
      try {
        const raw = await store.getItem(STORAGE_KEY);
        if (!cancelled) {
          const fromDisk = parseProcedures(raw);
          setProcedures((current) => {
            const next = mergeLoadedProcedures(
              builtinProcedures,
              fromDisk,
              current,
              pendingUpsertIdsRef.current,
            );
            proceduresRef.current = next;
            return next;
          });
          setStorageReady(true);
        }
      } catch (error) {
        console.error('Error loading procedures:', error);
        if (!cancelled) {
          setTrackedLastError(i18n.t('procedures.persistError'));
          setStorageReady(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProcedures();

    return () => {
      cancelled = true;
    };
  }, [setTrackedLastError, store]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return;
    }

    const onStorage = (event: Event) => {
      const key = (event as { key?: unknown }).key;
      if (key !== STORAGE_KEY) {
        return;
      }

      const newValue = (event as { newValue?: unknown }).newValue;
      const raw = typeof newValue === 'string' ? newValue : null;
      const fromDisk = parseProcedures(raw);
      setProcedures((current) => {
        const merged = mergeLoadedProcedures(
          builtinProcedures,
          fromDisk,
          current,
          pendingUpsertIdsRef.current,
        );
        const next =
          deletedIdsRef.current.size === 0
            ? merged
            : merged.filter(
                (procedure) =>
                  procedure.source !== 'user' || !deletedIdsRef.current.has(procedure.id),
              );
        proceduresRef.current = next;
        return next;
      });
    };

    window.addEventListener('storage', onStorage);
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  const persistAndTrack = useCallback(() => {
    if (!storageReady) {
      return Promise.resolve();
    }

    const run = async () => {
      try {
        for (let attempt = 0; attempt < PERSIST_RETRY_LIMIT; attempt += 1) {
          const raw = await store.getItem(STORAGE_KEY);
          const diskUsers = parseProcedures(raw);
          const intended = proceduresRef.current.filter((procedure) => procedure.source === 'user');
          const nextUsers = reconcilePersistedUsers(intended, diskUsers, deletedIdsRef.current);
          const payload = serializeProcedures(nextUsers);

          const latestRaw = await store.getItem(STORAGE_KEY);
          if (latestRaw !== raw) {
            continue;
          }

          await store.setItem(STORAGE_KEY, payload);

          const confirm = await store.getItem(STORAGE_KEY);
          if (confirm === payload) {
            for (const procedure of nextUsers) {
              pendingUpsertIdsRef.current.delete(procedure.id);
            }
            for (const id of deletedIdsRef.current) {
              pendingUpsertIdsRef.current.delete(id);
            }
            setTrackedLastError(null);
            return;
          }
        }

        throw new Error('Procedure persist conflict');
      } catch (error) {
        console.error('Error saving procedures:', error);
        setTrackedLastError(i18n.t('procedures.persistError'));
      }
    };

    persistChainRef.current = persistChainRef.current.then(run, run);
    return persistChainRef.current;
  }, [setTrackedLastError, storageReady, store]);

  const getProcedure = useCallback(
    (id: string) => procedures.find((procedure) => procedure.id === id),
    [procedures],
  );

  const search = useCallback((query: string) => searchProcedures(procedures, query), [procedures]);

  const createProcedure = useCallback(
    (draft: ProcedureDraft) => {
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

      pendingUpsertIdsRef.current.add(created.id);
      setProcedures((current) => {
        const next = [...current, created];
        proceduresRef.current = next;
        return next;
      });
      void persistAndTrack();

      return created;
    },
    [persistAndTrack, storageReady],
  );

  const updateProcedure = useCallback(
    (id: string, draft: ProcedureDraft) => {
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

      pendingUpsertIdsRef.current.add(id);
      setProcedures((current) => {
        const next = current.map((procedure) =>
          procedure.id === id ? updatedProcedure : procedure,
        );
        proceduresRef.current = next;
        return next;
      });
      void persistAndTrack();

      return updatedProcedure;
    },
    [persistAndTrack, procedures, storageReady],
  );

  const deleteProcedure = useCallback(
    (id: string) => {
      if (!storageReady) {
        return false;
      }

      const existing = procedures.find((procedure) => procedure.id === id);
      if (!existing || existing.source !== 'user') {
        return false;
      }

      deletedIdsRef.current.add(id);
      pendingUpsertIdsRef.current.delete(id);
      setProcedures((current) => {
        const next = current.filter((procedure) => procedure.id !== id);
        proceduresRef.current = next;
        return next;
      });
      void persistAndTrack();

      return true;
    },
    [persistAndTrack, procedures, storageReady],
  );

  const duplicateProcedure = useCallback(
    (id: string) => {
      if (!storageReady) {
        return null;
      }

      const source = procedures.find((procedure) => procedure.id === id);
      if (!source) {
        return null;
      }

      const copy = duplicateAsUserProcedure(source);

      pendingUpsertIdsRef.current.add(copy.id);
      setProcedures((current) => {
        const next = [...current, copy];
        proceduresRef.current = next;
        return next;
      });
      void persistAndTrack();

      return copy;
    },
    [persistAndTrack, procedures, storageReady],
  );

  const value = useMemo(
    () => ({
      procedures,
      isLoading,
      storageReady,
      lastError,
      getProcedure,
      search,
      createProcedure,
      updateProcedure,
      deleteProcedure,
      duplicateProcedure,
    }),
    [
      procedures,
      isLoading,
      storageReady,
      lastError,
      getProcedure,
      search,
      createProcedure,
      updateProcedure,
      deleteProcedure,
      duplicateProcedure,
    ],
  );

  return <ProceduresContext.Provider value={value}>{children}</ProceduresContext.Provider>;
}

export function useProcedures() {
  const context = useContext(ProceduresContext);
  if (context === undefined) {
    throw new Error('useProcedures must be used within a ProceduresProvider');
  }
  return context;
}
