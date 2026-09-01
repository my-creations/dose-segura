import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  check,
  checkMedsSource,
  compareMedicationKeys,
  fix,
  main,
  sortMedicationsMap,
} from '../../scripts/sort-meds-json';

function writeFixture(medications: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sort-meds-'));
  const filePath = path.join(dir, 'meds.json');
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ version: '1.0.0', lastUpdated: '2026-09-01', medications }, null, 2)}\n`,
  );
  return { dir, filePath };
}

describe('sort-meds-json', () => {
  it('orders keys naturally so item2 comes before item10', () => {
    expect(['item10', 'item2'].sort(compareMedicationKeys)).toEqual(['item2', 'item10']);
    expect(Object.keys(sortMedicationsMap({ item10: {}, item2: {}, item1: {} }))).toEqual([
      'item1',
      'item2',
      'item10',
    ]);
  });

  it('accepts already sorted medications keys', () => {
    expect(checkMedsSource(JSON.stringify({ medications: { alpha: {}, beta: {} } })).ok).toBe(true);
  });

  it('reports unsorted keys in --check mode without Infarmed', () => {
    const { filePath, dir } = writeFixture({ zeta: { id: 'zeta' }, alpha: { id: 'alpha' } });
    const errors: string[] = [];
    try {
      expect(() => check(filePath)).toThrow(/not sorted naturally/);
      const code = main(['--check', filePath], {
        log: jest.fn(),
        error: (...args: unknown[]) => {
          errors.push(String(args[0]));
        },
      });
      expect(code).toBe(1);
      expect(errors.join('\n')).toContain('lint:meds:fix');
      expect(errors.join('\n')).toContain('"zeta" should be "alpha"');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rewrites medications keys with --fix and then passes --check', () => {
    const { filePath, dir } = writeFixture({
      item10: { id: 'item10' },
      item2: { id: 'item2' },
      acetilcisteina: { id: 'acetilcisteina' },
    });
    try {
      const outcome = fix(filePath);
      expect(outcome.changed).toBe(true);
      expect(Object.keys(JSON.parse(fs.readFileSync(filePath, 'utf8')).medications)).toEqual([
        'acetilcisteina',
        'item2',
        'item10',
      ]);
      expect(() => check(filePath)).not.toThrow();
      expect(main(['--check', filePath], { log: jest.fn(), error: jest.fn() })).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a document without a medications object map', () => {
    expect(() => checkMedsSource('{"medications":[]}')).toThrow(
      /medications must be an object map/,
    );
  });
});
