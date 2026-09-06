import { BUILTIN_CVP_ID, BUILTIN_SNG_ID, builtinProcedures } from '@/procedures/builtin';
import {
  STORAGE_KEY,
  applyUserProcedureMutation,
  createUserProcedureId,
  duplicateAsUserProcedure,
  mergeLoadedProcedures,
  mergeProcedures,
  parseProcedures,
  reconcilePersistedUsers,
  sanitizeDraft,
  sanitizeProcedure,
  sanitizeStringList,
  searchProcedures,
  serializeProcedures,
  validateDraft,
} from '@/procedures/procedures';
import type { Procedure } from '@/types/procedure';

const userProcedure: Procedure = {
  id: 'user-test-1',
  title: 'Aspiração de secreções',
  materials: ['Luvas', 'Sonda'],
  steps: ['Identificar o doente', 'Higiene das mãos'],
  attention: ['Validar com o protocolo da instituição'],
  source: 'user',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('procedures domain', () => {
  it('exposes the stable storage key', () => {
    expect(STORAGE_KEY).toBe('@dose_segura_procedures');
  });

  it('ships conservative built-in starters without drug doses', () => {
    expect(builtinProcedures.map((procedure) => procedure.id)).toEqual([
      'builtin-cateterismo-venoso-periferico',
      'builtin-sondagem-nasogastrica',
    ]);

    const cvp = builtinProcedures.find((procedure) => procedure.id === BUILTIN_CVP_ID);
    expect(cvp?.title).toBe('Cateterismo venoso periférico');
    expect(cvp?.source).toBe('builtin');
    expect(cvp?.materials).toEqual(expect.arrayContaining(['Luvas', 'Garrote']));
    expect(cvp?.steps.some((step) => step.toLowerCase().includes('identificar'))).toBe(true);
    expect(cvp?.attention.some((item) => item.toLowerCase().includes('flebite'))).toBe(true);

    const joined = builtinProcedures
      .flatMap((procedure) => [...procedure.materials, ...procedure.steps, ...procedure.attention])
      .join(' ')
      .toLowerCase();
    expect(joined).not.toMatch(/\bmg\b|\bml\b|dose de /);
  });

  it('omits auscultation from nasogastric placement confirmation', () => {
    const sng = builtinProcedures.find((procedure) => procedure.id === BUILTIN_SNG_ID);
    const materials = sng?.materials ?? [];
    const attention = sng?.attention ?? [];
    const joinedMaterials = materials.join(' ').toLowerCase();

    expect(joinedMaterials).not.toMatch(/fonendoscópio|estetoscópio|auscult/);
    expect(sng?.steps).toContain('Verificar o posicionamento segundo o protocolo da instituição');
    expect(
      attention.some(
        (item) => item.includes('pH do aspirado') && item.includes('RX quando indicado'),
      ),
    ).toBe(true);
    expect(attention.some((item) => item.toLowerCase().includes('nunca por auscultação'))).toBe(
      true,
    );
  });

  it('releases the tourniquet before flush in peripheral venous catheterization', () => {
    const cvp = builtinProcedures.find((procedure) => procedure.id === BUILTIN_CVP_ID);
    const steps = cvp?.steps ?? [];
    const confirm = steps.indexOf('Confirmar retorno');
    const advance = steps.indexOf('Avançar o cateter');
    const release = steps.indexOf('Soltar o garrote');
    const mandril = steps.indexOf('Mandril para o contentor (nunca reintroduzir)');
    const fix = steps.indexOf('Fixar');
    const flush = steps.indexOf('Flush segundo protocolo');
    const document = steps.indexOf('Documentar');

    expect(confirm).toBeGreaterThanOrEqual(0);
    expect(advance).toBeGreaterThan(confirm);
    expect(release).toBeGreaterThan(advance);
    expect(mandril).toBeGreaterThan(release);
    expect(fix).toBeGreaterThan(mandril);
    expect(flush).toBeGreaterThan(fix);
    expect(document).toBeGreaterThan(flush);
  });

  it('parses valid user procedures and ignores invalid payloads', () => {
    expect(parseProcedures(null)).toEqual([]);
    expect(parseProcedures('not-json')).toEqual([]);
    expect(parseProcedures(JSON.stringify({ title: 'x' }))).toEqual([]);
    expect(parseProcedures(JSON.stringify([userProcedure]))).toEqual([userProcedure]);
  });

  it('does not accept built-in records from storage', () => {
    expect(sanitizeProcedure(builtinProcedures[0])).toBeNull();
    expect(
      parseProcedures(
        JSON.stringify([
          builtinProcedures[0],
          { ...userProcedure, source: 'builtin' },
          {
            id: 'builtin-forged',
            title: 'Fake',
            source: 'user',
            materials: [],
            steps: [],
            attention: [],
          },
        ]),
      ),
    ).toEqual([]);
  });

  it('sanitizes drafts and lists', () => {
    expect(sanitizeStringList(['  Luvas  ', '', 1, 'Garrote'])).toEqual(['Luvas', 'Garrote']);
    expect(
      sanitizeDraft({
        title: '  Punção  ',
        materials: [' Luvas ', ''],
        steps: [' Identificar '],
        attention: ['  '],
      }),
    ).toEqual({
      title: 'Punção',
      materials: ['Luvas'],
      steps: ['Identificar'],
      attention: [],
    });
    expect(validateDraft({ title: '  ', materials: [], steps: [], attention: [] })).toBe('title');
    expect(validateDraft({ title: 'Punção', materials: [], steps: [], attention: [] })).toBeNull();
  });

  it('serializes only user procedures', () => {
    expect(serializeProcedures([...builtinProcedures, userProcedure])).toBe(
      JSON.stringify([userProcedure]),
    );
  });

  it('merges built-ins with stored user procedures without overwriting starters', () => {
    const colliding: Procedure = {
      ...userProcedure,
      id: BUILTIN_CVP_ID,
      title: 'Should not replace builtin',
    };

    const merged = mergeProcedures(builtinProcedures, [userProcedure, colliding]);
    expect(merged[0]?.id).toBe(BUILTIN_CVP_ID);
    expect(merged[0]?.title).toBe('Cateterismo venoso periférico');
    expect(merged.some((procedure) => procedure.id === userProcedure.id)).toBe(true);
    expect(merged.filter((procedure) => procedure.id === BUILTIN_CVP_ID)).toHaveLength(1);
  });

  it('searches by title without accents or case', () => {
    const merged = mergeProcedures(builtinProcedures, [userProcedure]);
    expect(searchProcedures(merged, 'cateterismo')[0]?.id).toBe(BUILTIN_CVP_ID);
    expect(searchProcedures(merged, '  cateterismo  ')[0]?.id).toBe(BUILTIN_CVP_ID);
    expect(searchProcedures(merged, 'VENOSO').length).toBeGreaterThan(0);
    expect(searchProcedures(merged, 'aspiracao')[0]?.id).toBe(userProcedure.id);
    expect(searchProcedures(merged, 'inexistente-xyz')).toHaveLength(0);
    expect(searchProcedures(merged, '  ')).toHaveLength(merged.length);
  });

  it('creates unique user ids and duplicates into an editable copy', () => {
    const first = createUserProcedureId();
    const second = createUserProcedureId();
    expect(first).toMatch(/^user-/);
    expect(second).toMatch(/^user-/);
    expect(first).not.toBe(second);

    const copy = duplicateAsUserProcedure(builtinProcedures[0]!);
    expect(copy.source).toBe('user');
    expect(copy.id).toMatch(/^user-/);
    expect(copy.originId).toBe(BUILTIN_CVP_ID);
    expect(copy.title).toBe('Cateterismo venoso periférico (cópia)');
    expect(copy.materials).toEqual(builtinProcedures[0]?.materials);
    expect(copy.steps).toEqual(builtinProcedures[0]?.steps);
    expect(copy.attention).toEqual(builtinProcedures[0]?.attention);
  });

  it('keeps only pending in-memory upserts when applying disk state', () => {
    const diskUser: Procedure = {
      ...userProcedure,
      id: 'user-disk',
      title: 'Do disco',
    };
    const memorySameId: Procedure = {
      ...userProcedure,
      id: 'user-disk',
      title: 'Edicao em memoria',
    };
    const memoryExtra: Procedure = {
      ...userProcedure,
      id: 'user-memory-only',
      title: 'Ainda nao persistido',
    };
    const externallyDeleted: Procedure = {
      ...userProcedure,
      id: 'user-deleted-elsewhere',
      title: 'Apagado noutra aba',
    };

    const pending = new Set(['user-disk', 'user-memory-only']);
    const merged = mergeLoadedProcedures(
      builtinProcedures,
      [diskUser],
      [...builtinProcedures, memorySameId, memoryExtra, externallyDeleted],
      pending,
    );

    expect(merged.find((procedure) => procedure.id === 'user-disk')?.title).toBe(
      'Edicao em memoria',
    );
    expect(merged.some((procedure) => procedure.id === 'user-memory-only')).toBe(true);
    expect(merged.some((procedure) => procedure.id === 'user-deleted-elsewhere')).toBe(false);
    expect(merged[0]?.id).toBe(BUILTIN_CVP_ID);
  });

  it('rejects empty or whitespace titles and does not treat blank list items as content', () => {
    expect(validateDraft({ title: '', materials: ['Luvas'], steps: ['A'], attention: [] })).toBe(
      'title',
    );
    expect(validateDraft({ title: '   ', materials: [], steps: [], attention: [] })).toBe('title');
    expect(
      sanitizeDraft({
        title: 'Punção',
        materials: ['  ', 'Luvas', ''],
        steps: ['   '],
        attention: ['  alerta  '],
      }),
    ).toEqual({
      title: 'Punção',
      materials: ['Luvas'],
      steps: [],
      attention: ['alerta'],
    });
    expect(validateDraft({ title: 'Punção', materials: [], steps: [], attention: [] })).toBeNull();
  });

  it('searches with padded, empty, whitespace and unknown queries', () => {
    const merged = mergeProcedures(builtinProcedures, [userProcedure]);
    expect(searchProcedures(merged, '  cateterismo  ')[0]?.id).toBe(BUILTIN_CVP_ID);
    expect(searchProcedures(merged, '')).toHaveLength(merged.length);
    expect(searchProcedures(merged, '   ')).toHaveLength(merged.length);
    expect(searchProcedures(merged, 'inexistente-xyz')).toHaveLength(0);
    expect(searchProcedures(merged, 'CATETERISMO')).toHaveLength(1);
  });

  it('keeps pending extras on empty/partial disk and honors non-pending external deletions', () => {
    const memoryExtra: Procedure = {
      ...userProcedure,
      id: 'user-memory-only',
      title: 'Ainda nao persistido',
    };
    const diskUser: Procedure = {
      ...userProcedure,
      id: 'user-disk',
      title: 'Do disco',
    };
    const memorySameId: Procedure = {
      ...userProcedure,
      id: 'user-disk',
      title: 'Edicao em memoria',
    };
    const externallyDeleted: Procedure = {
      ...userProcedure,
      id: 'user-gone',
      title: 'Apagado noutra aba',
    };

    const fromEmptyDisk = mergeLoadedProcedures(
      builtinProcedures,
      [],
      [...builtinProcedures, memoryExtra],
      new Set(['user-memory-only']),
    );
    expect(fromEmptyDisk.some((procedure) => procedure.id === 'user-memory-only')).toBe(true);
    expect(fromEmptyDisk[0]?.id).toBe(BUILTIN_CVP_ID);

    const dropsNonPendingExtra = mergeLoadedProcedures(
      builtinProcedures,
      [],
      [...builtinProcedures, memoryExtra, externallyDeleted],
      new Set(['user-memory-only']),
    );
    expect(dropsNonPendingExtra.some((procedure) => procedure.id === 'user-memory-only')).toBe(
      true,
    );
    expect(dropsNonPendingExtra.some((procedure) => procedure.id === 'user-gone')).toBe(false);

    const memoryWins = mergeLoadedProcedures(
      builtinProcedures,
      [diskUser],
      [...builtinProcedures, memorySameId],
      new Set(['user-disk']),
    );
    expect(memoryWins.find((procedure) => procedure.id === 'user-disk')?.title).toBe(
      'Edicao em memoria',
    );

    const diskWinsWithoutPending = mergeLoadedProcedures(
      builtinProcedures,
      [diskUser],
      [...builtinProcedures, memorySameId],
    );
    expect(diskWinsWithoutPending.find((procedure) => procedure.id === 'user-disk')?.title).toBe(
      'Do disco',
    );

    const diskOnly = mergeLoadedProcedures(builtinProcedures, [diskUser], builtinProcedures);
    expect(diskOnly.find((procedure) => procedure.id === 'user-disk')?.title).toBe('Do disco');
    expect(diskOnly.filter((procedure) => procedure.source === 'user')).toHaveLength(1);
  });

  it('does not treat built-in current rows as user extras on load', () => {
    const merged = mergeLoadedProcedures(builtinProcedures, [], builtinProcedures);
    expect(merged.map((procedure) => procedure.id)).toEqual(
      builtinProcedures.map((item) => item.id),
    );
    expect(merged.every((procedure) => procedure.source === 'builtin')).toBe(true);
  });

  it('ignores invalid stored records and keeps originId on valid user copies', () => {
    expect(sanitizeProcedure(null)).toBeNull();
    expect(sanitizeProcedure('x')).toBeNull();
    expect(sanitizeProcedure({ id: 'nope', title: 'X', source: 'user' })).toBeNull();
    expect(sanitizeProcedure({ id: 'user-1', title: '  ', source: 'user' })).toBeNull();
    expect(
      sanitizeProcedure({
        id: 'user-1',
        title: 'Cópia',
        source: 'user',
        materials: ['Luvas'],
        steps: ['A'],
        attention: [],
        originId: BUILTIN_CVP_ID,
      })?.originId,
    ).toBe(BUILTIN_CVP_ID);
    expect(parseProcedures(JSON.stringify([userProcedure, { id: 'user-bad' }, null, 'x']))).toEqual(
      [userProcedure],
    );
  });

  it('duplicates into a detached user copy with a cópia title', () => {
    const source = builtinProcedures[0]!;
    const copy = duplicateAsUserProcedure(source);
    copy.materials.push('should not leak');
    expect(source.materials).not.toContain('should not leak');
    expect(copy.title).toBe(`${source.title} (cópia)`);
    expect(copy.id).toMatch(/^user-/);
    expect(copy.id).not.toBe(source.id);
    expect(copy.source).toBe('user');
    expect(copy.originId).toBe(source.id);
  });

  it('serializes an empty user list when only built-ins are present', () => {
    expect(serializeProcedures(builtinProcedures)).toBe('[]');
  });

  it('applies create, update and delete onto stored user procedures only', () => {
    const other: Procedure = {
      ...userProcedure,
      id: 'user-other',
      title: 'Outro',
    };
    const created: Procedure = {
      ...userProcedure,
      id: 'user-created',
      title: 'Novo',
    };
    const updated: Procedure = {
      ...userProcedure,
      title: 'Aspiração editada',
    };

    const afterCreate = applyUserProcedureMutation([userProcedure], {
      type: 'upsert',
      procedure: created,
    });
    expect(afterCreate.map((procedure) => procedure.id)).toEqual(['user-test-1', 'user-created']);

    const afterUpdate = applyUserProcedureMutation([userProcedure, other], {
      type: 'upsert',
      procedure: updated,
    });
    expect(afterUpdate.find((procedure) => procedure.id === 'user-test-1')?.title).toBe(
      'Aspiração editada',
    );
    expect(afterUpdate.find((procedure) => procedure.id === 'user-other')?.title).toBe('Outro');

    const afterDelete = applyUserProcedureMutation([userProcedure, other], {
      type: 'delete',
      id: 'user-test-1',
    });
    expect(afterDelete.map((procedure) => procedure.id)).toEqual(['user-other']);
    expect(
      applyUserProcedureMutation(builtinProcedures, { type: 'upsert', procedure: created }).map(
        (procedure) => procedure.id,
      ),
    ).toEqual(['user-created']);
  });

  it('unions intended users with unknown disk users and omits deleted ids', () => {
    const intended: Procedure = {
      ...userProcedure,
      id: 'user-created',
      title: 'Em memória',
    };
    const staleSameId: Procedure = {
      ...userProcedure,
      id: 'user-created',
      title: 'No disco',
    };
    const fromOtherTab: Procedure = {
      ...userProcedure,
      id: 'user-other-tab',
      title: 'Da outra aba',
    };
    const deleted: Procedure = {
      ...userProcedure,
      id: 'user-deleted',
      title: 'Apagado nesta aba',
    };

    const reconciled = reconcilePersistedUsers(
      [intended],
      [staleSameId, fromOtherTab, deleted],
      new Set(['user-deleted']),
    );

    expect(reconciled.map((procedure) => procedure.id)).toEqual(['user-created', 'user-other-tab']);
    expect(reconciled.find((procedure) => procedure.id === 'user-created')?.title).toBe(
      'Em memória',
    );
  });
});
