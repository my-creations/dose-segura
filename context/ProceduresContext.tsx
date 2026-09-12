import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  createUserProceduresWorkspace,
  type UserProceduresWorkspace,
} from '@/procedures/userProcedures';
import { keyValueStore } from '@/storage/keyValueStore';
import type { KeyValueStore } from '@/storage/types';
import type { Procedure, ProcedureDraft } from '@/types/procedure';

export interface ProceduresContextType {
  /** Visible Procedures List — user procedures only (catalog templates are not auto-listed). */
  procedures: Procedure[];
  /** Bundled catalog templates (CVP, SNG, …). */
  catalogTemplates: Procedure[];
  isLoading: boolean;
  storageReady: boolean;
  lastError: string | null;
  getProcedure: (id: string) => Procedure | undefined;
  search: (query: string) => Procedure[];
  createProcedure: (draft: ProcedureDraft) => Procedure | null;
  updateProcedure: (id: string, draft: ProcedureDraft) => Procedure | null;
  deleteProcedure: (id: string) => boolean;
  duplicateProcedure: (id: string) => Procedure | null;
  /** Clone a catalog template into the user list (same title, new id, originId set). */
  addFromCatalog: (templateId: string) => Procedure | null;
  /** Templates not yet present in the user list (by originId or title). */
  getAvailableCatalogTemplates: () => Procedure[];
  isTemplateAdopted: (templateId: string) => boolean;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

interface ProceduresProviderProps {
  children: React.ReactNode;
  /** Optional store override for tests. */
  store?: KeyValueStore;
}

function bindWorkspace(workspace: UserProceduresWorkspace): ProceduresContextType {
  const snapshot = workspace.getSnapshot();
  return {
    procedures: snapshot.procedures,
    catalogTemplates: workspace.catalogTemplates as Procedure[],
    isLoading: snapshot.isLoading,
    storageReady: snapshot.storageReady,
    lastError: snapshot.lastError,
    getProcedure: (id) => workspace.getProcedure(id),
    search: (query) => workspace.search(query),
    createProcedure: (draft) => workspace.createProcedure(draft),
    updateProcedure: (id, draft) => workspace.updateProcedure(id, draft),
    deleteProcedure: (id) => workspace.deleteProcedure(id),
    duplicateProcedure: (id) => workspace.duplicateProcedure(id),
    addFromCatalog: (templateId) => workspace.addFromCatalog(templateId),
    getAvailableCatalogTemplates: () => workspace.getAvailableCatalogTemplates(),
    isTemplateAdopted: (templateId) => workspace.isTemplateAdopted(templateId),
  };
}

/**
 * Thin React adapter over UserProceduresWorkspace.
 * Screens keep the same useProcedures / ProceduresContextType API.
 */
export function ProceduresProvider({ children, store = keyValueStore }: ProceduresProviderProps) {
  const workspace = useMemo(() => createUserProceduresWorkspace(store), [store]);
  const [value, setValue] = useState(() => bindWorkspace(workspace));

  useEffect(() => {
    setValue(bindWorkspace(workspace));
    workspace.start();
    const unsubscribe = workspace.subscribe(() => {
      setValue(bindWorkspace(workspace));
    });
    // Mirror any state settled synchronously during start().
    setValue(bindWorkspace(workspace));

    return () => {
      unsubscribe();
      workspace.dispose();
    };
  }, [workspace]);

  return <ProceduresContext.Provider value={value}>{children}</ProceduresContext.Provider>;
}

export function useProcedures() {
  const context = useContext(ProceduresContext);
  if (context === undefined) {
    throw new Error('useProcedures must be used within a ProceduresProvider');
  }
  return context;
}
