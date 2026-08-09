import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  validateCatalogShape,
  validateIndexConsistency,
  validateMedsFiles,
} from '../../scripts/validate-meds';

function writeTempCatalogs(full: unknown, index: unknown) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dose-segura-meds-'));
  const fullPath = path.join(dir, 'meds.json');
  const indexPath = path.join(dir, 'meds-index.json');
  fs.writeFileSync(fullPath, JSON.stringify(full));
  fs.writeFileSync(indexPath, JSON.stringify(index));
  return { dir, fullPath, indexPath };
}

const sampleFullMed = {
  id: 'demo',
  name: 'Demo',
  aliases: ['D'],
  highRisk: false,
  classification: ['Test'],
  compatibility: ['Cloreto de sódio 0,9%'],
  presentationAndStorage: ['1 ml'],
  preparation: ['Pronto'],
  administration: ['Via Endovenosa'],
  stability: [],
  contraindicationsAndPrecautions: ['Hipersensibilidade'],
  nursingCare: ['Monitorizar'],
};

const sampleIndexMed = {
  id: 'demo',
  name: 'Demo',
  aliases: ['D'],
  highRisk: false,
  classification: ['Test'],
};

describe('validate-meds', () => {
  it('accepts the real project catalog files', () => {
    const result = validateMedsFiles();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects missing detail keys in full catalog', () => {
    const broken = {
      version: '1.0.0',
      lastUpdated: '2026-08-09',
      medications: {
        demo: {
          id: 'demo',
          name: 'Demo',
          aliases: [],
          highRisk: false,
          classification: ['Test'],
        },
      },
    };

    const errors = validateCatalogShape(broken, 'full');
    expect(errors.some((error) => error.includes('missing required key "compatibility"'))).toBe(
      true,
    );
  });

  it('rejects id/map-key mismatch and empty string items', () => {
    const broken = {
      version: '1.0.0',
      lastUpdated: '2026-08-09',
      medications: {
        demo: {
          ...sampleFullMed,
          id: 'other',
          aliases: ['ok', '  '],
        },
      },
    };

    const errors = validateCatalogShape(broken, 'full');
    expect(errors.some((error) => error.includes('id must equal map key'))).toBe(true);
    expect(errors.some((error) => error.includes('aliases must be an array of non-empty strings'))).toBe(
      true,
    );
  });

  it('detects index/full drift', () => {
    const full = {
      version: '1.0.0',
      lastUpdated: '2026-08-09',
      medications: {
        demo: sampleFullMed,
        other: { ...sampleFullMed, id: 'other', name: 'Other' },
      },
    };
    const index = {
      version: '1.0.1',
      lastUpdated: '2026-08-01',
      medications: {
        demo: { ...sampleIndexMed, name: 'Changed' },
      },
    };

    const errors = validateIndexConsistency(full as never, index as never);
    expect(errors.some((error) => error.includes('version mismatch'))).toBe(true);
    expect(errors.some((error) => error.includes('lastUpdated mismatch'))).toBe(true);
    expect(errors.some((error) => error.includes('index missing medication id "other"'))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes('summary field mismatch for "demo.name"'))).toBe(
      true,
    );
  });

  it('validateMedsFiles reads temp paths', () => {
    const full = {
      version: '1.0.0',
      lastUpdated: '2026-08-09',
      medications: { demo: sampleFullMed },
    };
    const index = {
      version: '1.0.0',
      lastUpdated: '2026-08-09',
      medications: { demo: sampleIndexMed },
    };
    const { dir, fullPath, indexPath } = writeTempCatalogs(full, index);

    try {
      const result = validateMedsFiles({ fullPath, indexPath });
      expect(result).toEqual({ ok: true, errors: [] });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
