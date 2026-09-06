import { builtinProcedures } from '@/procedures/builtin';
import type { Procedure, ProcedureDraft } from '@/types/procedure';

export const STORAGE_KEY = '@dose_segura_procedures';

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

export function sanitizeDraft(input: ProcedureDraft): ProcedureDraft {
  return {
    title: input.title.trim(),
    materials: sanitizeStringList(input.materials),
    steps: sanitizeStringList(input.steps),
    attention: sanitizeStringList(input.attention),
  };
}

export function validateDraft(input: ProcedureDraft): string | null {
  if (!input.title.trim()) {
    return 'title';
  }

  return null;
}

export function createUserProcedureId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeProcedure(raw: unknown): Procedure | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (typeof raw.id !== 'string' || !raw.id.startsWith('user-')) {
    return null;
  }

  if (raw.source === 'builtin') {
    return null;
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) {
    return null;
  }

  const procedure: Procedure = {
    id: raw.id,
    title,
    materials: sanitizeStringList(raw.materials),
    steps: sanitizeStringList(raw.steps),
    attention: sanitizeStringList(raw.attention),
    source: 'user',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
  };

  if (typeof raw.originId === 'string' && raw.originId.length > 0) {
    procedure.originId = raw.originId;
  }

  return procedure;
}

export function parseProcedures(raw: string | null): Procedure[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => sanitizeProcedure(item))
      .filter((item): item is Procedure => item !== null);
  } catch {
    return [];
  }
}

export function serializeProcedures(procedures: readonly Procedure[]): string {
  return JSON.stringify(procedures.filter((procedure) => procedure.source === 'user'));
}

export type ProcedurePersistMutation =
  | { type: 'upsert'; procedure: Procedure }
  | { type: 'delete'; id: string };

/** Apply one mutation onto the latest stored user procedures (never builtins). */
export function applyUserProcedureMutation(
  stored: readonly Procedure[],
  mutation: ProcedurePersistMutation,
): Procedure[] {
  const users = stored.filter((procedure) => procedure.source === 'user');

  if (mutation.type === 'delete') {
    return users.filter((procedure) => procedure.id !== mutation.id);
  }

  if (mutation.procedure.source !== 'user') {
    return users;
  }

  const index = users.findIndex((procedure) => procedure.id === mutation.procedure.id);
  if (index === -1) {
    return [...users, mutation.procedure];
  }

  const next = [...users];
  next[index] = mutation.procedure;
  return next;
}

/**
 * Persist this tab's full intended user list, unioned with disk users this tab
 * does not know about, minus ids this tab deleted. Memory wins on id clashes.
 */
export function reconcilePersistedUsers(
  intendedUsers: readonly Procedure[],
  diskUsers: readonly Procedure[],
  deletedIds: ReadonlySet<string>,
): Procedure[] {
  const intended = intendedUsers.filter(
    (procedure) => procedure.source === 'user' && !deletedIds.has(procedure.id),
  );
  const intendedIds = new Set(intended.map((procedure) => procedure.id));
  const extrasFromDisk = diskUsers.filter(
    (procedure) =>
      procedure.source === 'user' &&
      !intendedIds.has(procedure.id) &&
      !deletedIds.has(procedure.id),
  );

  return [...intended, ...extrasFromDisk];
}

export function mergeProcedures(
  builtins: readonly Procedure[] = builtinProcedures,
  stored: readonly Procedure[] = [],
): Procedure[] {
  const builtinIds = new Set(builtins.map((procedure) => procedure.id));
  const users = stored.filter(
    (procedure) => procedure.source === 'user' && !builtinIds.has(procedure.id),
  );

  return [...builtins, ...users];
}

/**
 * Merge disk users into current state. Memory extras / same-id overrides are kept
 * only for ids in `pendingUpsertIds` (local creates/updates not yet confirmed on disk),
 * so external deletions from other tabs are honored.
 */
export function mergeLoadedProcedures(
  builtins: readonly Procedure[],
  fromDisk: readonly Procedure[],
  current: readonly Procedure[],
  pendingUpsertIds: ReadonlySet<string> = new Set(),
): Procedure[] {
  const memoryUsers = current.filter((procedure) => procedure.source === 'user');
  const memoryById = new Map(memoryUsers.map((procedure) => [procedure.id, procedure]));
  const diskIds = new Set(fromDisk.map((procedure) => procedure.id));
  const extras = memoryUsers.filter(
    (procedure) => !diskIds.has(procedure.id) && pendingUpsertIds.has(procedure.id),
  );
  const diskWithPendingWins = fromDisk.map((procedure) => {
    if (!pendingUpsertIds.has(procedure.id)) {
      return procedure;
    }
    return memoryById.get(procedure.id) ?? procedure;
  });

  return mergeProcedures(builtins, [...diskWithPendingWins, ...extras]);
}

export function searchProcedures(procedures: readonly Procedure[], query: string): Procedure[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [...procedures];
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);

  return procedures.filter((procedure) =>
    normalizeSearchText(procedure.title).includes(normalizedQuery),
  );
}

export function duplicateAsUserProcedure(source: Procedure): Procedure {
  return {
    id: createUserProcedureId(),
    title: `${source.title} (cópia)`,
    materials: [...source.materials],
    steps: [...source.steps],
    attention: [...source.attention],
    source: 'user',
    originId: source.id,
    updatedAt: new Date().toISOString(),
  };
}

export function isUserProcedure(procedure: Procedure): boolean {
  return procedure.source === 'user';
}
