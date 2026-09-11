import {
  BUILTIN_ADMINISTRACAO_IM_ID,
  BUILTIN_ADMINISTRACAO_SC_ID,
  BUILTIN_CVP_ID,
  BUILTIN_FLUSH_REMOCAO_CVP_ID,
  BUILTIN_IV_PUSH_BOLUS_ID,
  BUILTIN_MEDICACAO_SNG_ID,
  BUILTIN_PREPARACAO_INJECTAVEIS_ID,
  BUILTIN_SNG_ID,
  builtinProcedures,
} from '@/procedures/builtin';
import {
  CATALOG_MIGRATION_KEY,
  CATALOG_MIGRATION_VALUE,
  STORAGE_KEY,
  adoptFromCatalog,
  applyUserProcedureMutation,
  availableCatalogTemplates,
  createUserProcedureId,
  duplicateAsUserProcedure,
  isCatalogOrigin,
  isCatalogTemplateAdopted,
  mergeLoadedProcedures,
  mergeProcedures,
  parseProcedures,
  reconcilePersistedUsers,
  sanitizeDraft,
  sanitizeProcedure,
  sanitizeStringList,
  searchProcedures,
  seedMissingCatalogTemplates,
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
      'builtin-preparacao-medicamentos-injectaveis',
      'builtin-administracao-subcutanea',
      'builtin-administracao-intramuscular',
      'builtin-flush-remocao-cvp',
      'builtin-medicacao-sonda-nasogastrica',
      'builtin-administracao-iv-push-bolus',
    ]);

    const cvp = builtinProcedures.find((procedure) => procedure.id === BUILTIN_CVP_ID);
    expect(cvp?.title).toBe('Cateterismo venoso periférico');
    expect(cvp?.source).toBe('builtin');
    expect(cvp?.materials).toEqual(expect.arrayContaining(['Luvas', 'Garrote']));
    expect(cvp?.steps.some((step) => step.toLowerCase().includes('identificar'))).toBe(true);
    expect(cvp?.steps).toContain('Explicar o procedimento');
    expect(cvp?.attention.some((item) => item.toLowerCase().includes('flebite'))).toBe(true);
    expect(
      cvp?.attention.some((item) => item.toLowerCase().includes('não palpar após antissepsia')),
    ).toBe(true);
    expect(cvp?.attention.some((item) => item.toLowerCase().includes('avaliar diariamente'))).toBe(
      true,
    );

    const joined = builtinProcedures
      .flatMap((procedure) => [...procedure.materials, ...procedure.steps, ...procedure.attention])
      .join(' ')
      .toLowerCase();
    expect(joined).not.toMatch(/\bmg\b|\bml\b|dose de /);

    for (const procedure of builtinProcedures) {
      expect(
        procedure.attention.some((item) =>
          item.includes('Validar sempre com o protocolo da instituição e o RCM'),
        ),
      ).toBe(true);
    }
  });

  it('omits auscultation from nasogastric placement confirmation', () => {
    const sng = builtinProcedures.find((procedure) => procedure.id === BUILTIN_SNG_ID);
    const materials = sng?.materials ?? [];
    const attention = sng?.attention ?? [];
    const steps = sng?.steps ?? [];
    const joinedMaterials = materials.join(' ').toLowerCase();
    const joinedSteps = steps.join(' ').toLowerCase();

    expect(joinedMaterials).not.toMatch(/fonendoscópio|estetoscópio|auscult/);
    expect(joinedMaterials).toMatch(/ph/i);
    expect(joinedSteps).toMatch(/nex|nariz/);
    expect(
      steps.some(
        (step) => step.toLowerCase().includes('tosse') || step.toLowerCase().includes('dispneia'),
      ),
    ).toBe(true);
    expect(
      steps.some(
        (step) =>
          step.includes('Verificar o posicionamento segundo o protocolo da instituição') &&
          step.toLowerCase().includes('nunca auscultação'),
      ),
    ).toBe(true);
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
    const explain = steps.indexOf('Explicar o procedimento');
    const confirm = steps.indexOf('Confirmar retorno');
    const advance = steps.indexOf('Avançar o cateter');
    const release = steps.indexOf('Soltar o garrote');
    const mandril = steps.indexOf('Mandril para o contentor (nunca reintroduzir)');
    const fix = steps.findIndex((step) => step.toLowerCase().includes('fixar'));
    const flush = steps.findIndex((step) => step.toLowerCase().startsWith('flush'));
    const document = steps.indexOf('Documentar');

    expect(explain).toBeGreaterThanOrEqual(0);
    expect(confirm).toBeGreaterThan(explain);
    expect(advance).toBeGreaterThan(confirm);
    expect(release).toBeGreaterThan(advance);
    expect(mandril).toBeGreaterThan(release);
    expect(fix).toBeGreaterThan(mandril);
    expect(flush).toBeGreaterThan(fix);
    expect(document).toBeGreaterThan(flush);
  });

  it('ships A-list catalog templates with IV push safety disclaimer', () => {
    const byId = Object.fromEntries(
      builtinProcedures.map((procedure) => [procedure.id, procedure]),
    );

    expect(byId[BUILTIN_PREPARACAO_INJECTAVEIS_ID]?.title).toBe(
      'Preparação de medicamentos injectáveis',
    );
    expect(byId[BUILTIN_ADMINISTRACAO_SC_ID]?.title).toBe('Administração subcutânea (SC)');
    expect(byId[BUILTIN_ADMINISTRACAO_IM_ID]?.title).toBe('Administração intramuscular (IM)');
    expect(byId[BUILTIN_FLUSH_REMOCAO_CVP_ID]?.title).toBe('Flush e remoção de CVP');
    expect(byId[BUILTIN_MEDICACAO_SNG_ID]?.title).toBe('Medicação por sonda nasogástrica');
    expect(byId[BUILTIN_IV_PUSH_BOLUS_ID]?.title).toBe('Administração IV push/bolus');

    const scAttention = (byId[BUILTIN_ADMINISTRACAO_SC_ID]?.attention ?? [])
      .join(' ')
      .toLowerCase();
    expect(scAttention).toMatch(/aspiração/);
    expect(scAttention).toMatch(/pop|rcm/);

    const imAttention = (byId[BUILTIN_ADMINISTRACAO_IM_ID]?.attention ?? [])
      .join(' ')
      .toLowerCase();
    expect(imAttention).toMatch(/não contradizer o pop local|protocolo local/);

    const medSng = byId[BUILTIN_MEDICACAO_SNG_ID];
    expect((medSng?.attention ?? []).join(' ').toLowerCase()).toMatch(/nunca.*auscultação/);
    expect((medSng?.steps ?? []).join(' ').toLowerCase()).toMatch(/um fármaco de cada vez/);

    const ivAttention = (byId[BUILTIN_IV_PUSH_BOLUS_ID]?.attention ?? []).join(' ');
    expect(ivAttention).toMatch(/AVISO DE SEGURANÇA/);
    expect(ivAttention.toLowerCase()).toMatch(/não substitui/);
    expect(ivAttention.toLowerCase()).toMatch(/em dúvida/);
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

  it('lists only stored user procedures and drops forged builtin id collisions', () => {
    const colliding: Procedure = {
      ...userProcedure,
      id: BUILTIN_CVP_ID,
      title: 'Should not replace builtin',
    };

    const merged = mergeProcedures(builtinProcedures, [userProcedure, colliding]);
    expect(merged.map((procedure) => procedure.id)).toEqual([userProcedure.id]);
    expect(merged.every((procedure) => procedure.source === 'user')).toBe(true);
    expect(merged.some((procedure) => procedure.id === BUILTIN_CVP_ID)).toBe(false);
  });

  it('searches by title without accents or case', () => {
    const adopted = adoptFromCatalog(builtinProcedures[0]!);
    const merged = mergeProcedures(builtinProcedures, [userProcedure, adopted]);
    expect(searchProcedures(merged, 'cateterismo')[0]?.id).toBe(adopted.id);
    expect(searchProcedures(merged, '  cateterismo  ')[0]?.id).toBe(adopted.id);
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

    const adopted = adoptFromCatalog(builtinProcedures[0]!);
    expect(adopted.title).toBe('Cateterismo venoso periférico');
    expect(adopted.originId).toBe(BUILTIN_CVP_ID);
    expect(adopted.source).toBe('user');
  });

  it('treats catalog templates and adopted copies as catalog origin for badges', () => {
    expect(isCatalogOrigin(builtinProcedures[0]!)).toBe(true);
    const adopted = adoptFromCatalog(builtinProcedures[0]!);
    expect(isCatalogOrigin(adopted)).toBe(true);
    expect(isCatalogOrigin(userProcedure)).toBe(false);
    expect(
      isCatalogOrigin({
        ...userProcedure,
        originId: 'not-a-catalog-id',
      }),
    ).toBe(false);
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
    expect(merged.every((procedure) => procedure.source === 'user')).toBe(true);
    expect(merged.some((procedure) => procedure.id === BUILTIN_CVP_ID)).toBe(false);
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
    const adopted = adoptFromCatalog(builtinProcedures[0]!);
    const merged = mergeProcedures(builtinProcedures, [userProcedure, adopted]);
    expect(searchProcedures(merged, '  cateterismo  ')[0]?.id).toBe(adopted.id);
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
    expect(fromEmptyDisk.every((procedure) => procedure.source === 'user')).toBe(true);

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

  it('does not treat catalog template rows in current state as user extras on load', () => {
    const merged = mergeLoadedProcedures(builtinProcedures, [], builtinProcedures);
    expect(merged).toEqual([]);
  });

  it('seeds missing catalog templates once and tracks adoption by originId or title', () => {
    expect(CATALOG_MIGRATION_KEY).toBe('@dose_segura_procedures_catalog_v1');
    expect(CATALOG_MIGRATION_VALUE).toBe('1');

    const seeded = seedMissingCatalogTemplates([]);
    expect(seeded).toHaveLength(builtinProcedures.length);
    expect(seeded.every((procedure) => procedure.source === 'user')).toBe(true);
    expect(seeded.map((procedure) => procedure.originId).sort()).toEqual(
      builtinProcedures.map((item) => item.id).sort(),
    );

    const again = seedMissingCatalogTemplates(seeded);
    expect(again).toBe(seeded);

    expect(isCatalogTemplateAdopted(seeded, builtinProcedures[0]!)).toBe(true);
    expect(availableCatalogTemplates(builtinProcedures, seeded)).toEqual([]);

    const withoutCvp = seeded.filter((procedure) => procedure.originId !== BUILTIN_CVP_ID);
    expect(availableCatalogTemplates(builtinProcedures, withoutCvp).map((item) => item.id)).toEqual(
      [BUILTIN_CVP_ID],
    );

    const titledOnly: Procedure = {
      ...userProcedure,
      id: 'user-title-match',
      title: 'Cateterismo venoso periférico',
    };
    expect(isCatalogTemplateAdopted([titledOnly], builtinProcedures[0]!)).toBe(true);
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
