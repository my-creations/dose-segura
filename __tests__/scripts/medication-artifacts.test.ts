import fs from 'fs';
import path from 'path';

import {
  MedicationArtifactError,
  createMedicationArtifactModule,
  createNodeMedicationArtifactStore,
} from '../../scripts/medication-artifacts';

const fullMedication = {
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

function canonical(overrides: Record<string, unknown> = {}) {
  return {
    version: '1.0.0',
    lastUpdated: '2026-08-09',
    medications: { demo: fullMedication },
    ...overrides,
  };
}

function createMemoryStore(source = canonical()) {
  const artifacts = new Map<string, string>();
  const writes: Array<{ name: string; contents: string }> = [];

  return {
    store: {
      readCanonical: () => JSON.stringify(source),
      readArtifact: (name: string) => artifacts.get(name),
      replaceArtifact: (name: string, contents: string) => {
        artifacts.set(name, contents);
        writes.push({ name, contents });
      },
    },
    artifacts,
    writes,
  };
}

describe('Medication Artifact Module', () => {
  it('syncs both projections from the sole authored source', () => {
    const memory = createMemoryStore();
    const artifacts = createMedicationArtifactModule(memory.store);

    const report = artifacts.sync();

    expect(report.medicationCount).toBe(1);
    expect(report.artifacts).toEqual([
      { name: 'index', status: 'written' },
      { name: 'webFull', status: 'written' },
    ]);

    const index = JSON.parse(memory.artifacts.get('index')!);
    expect(index.medications.demo).toEqual({
      id: 'demo',
      name: 'Demo',
      aliases: ['D'],
      highRisk: false,
      classification: ['Test'],
    });
    expect(index.medications.demo).not.toHaveProperty('nursingCare');

    const webFull = JSON.parse(memory.artifacts.get('webFull')!);
    expect(webFull).toEqual(canonical());
  });

  it('is deterministic and does not rewrite current artifacts', () => {
    const source = canonical({
      medications: {
        zeta: { ...fullMedication, id: 'zeta', name: 'Zeta' },
        alpha: { ...fullMedication, id: 'alpha', name: 'Alpha' },
      },
    });
    const memory = createMemoryStore(source);
    const artifacts = createMedicationArtifactModule(memory.store);

    artifacts.sync();
    const firstIndex = memory.artifacts.get('index');
    const firstWebFull = memory.artifacts.get('webFull');
    const secondReport = artifacts.sync();

    expect(secondReport.artifacts).toEqual([
      { name: 'index', status: 'current' },
      { name: 'webFull', status: 'current' },
    ]);
    expect(memory.writes).toHaveLength(2);
    expect(memory.artifacts.get('index')).toBe(firstIndex);
    expect(memory.artifacts.get('webFull')).toBe(firstWebFull);
    expect(Object.keys(JSON.parse(firstIndex!).medications)).toEqual(['alpha', 'zeta']);
  });

  it('reports all stale or missing projections without writing', () => {
    const memory = createMemoryStore();
    memory.artifacts.set('index', '{}\n');
    const artifacts = createMedicationArtifactModule(memory.store);

    expect(() => artifacts.check()).toThrow(MedicationArtifactError);

    try {
      artifacts.check();
    } catch (error) {
      const artifactError = error as InstanceType<typeof MedicationArtifactError>;
      expect(artifactError.issues).toEqual([
        'data/meds-index.json is stale',
        'public/meds-full.json is missing',
      ]);
      expect(artifactError.message).toContain('npm run generate:meds');
    }
    expect(memory.writes).toHaveLength(0);
  });

  it('does not write any projection when canonical data is invalid', () => {
    const broken = canonical({
      medications: {
        demo: { ...fullMedication, id: 'wrong-id' },
      },
    });
    const memory = createMemoryStore(broken);
    const artifacts = createMedicationArtifactModule(memory.store);

    expect(() => artifacts.sync()).toThrow(/id must equal map key/);
    expect(memory.writes).toHaveLength(0);
  });

  it('keeps the index current when only Medication Details change', () => {
    const memory = createMemoryStore();
    const artifacts = createMedicationArtifactModule(memory.store);
    artifacts.sync();

    const changedSource = canonical({
      medications: {
        demo: { ...fullMedication, nursingCare: ['Monitorizar pressão arterial'] },
      },
    });
    memory.store.readCanonical = () => JSON.stringify(changedSource);

    expect(() => artifacts.check()).toThrow(MedicationArtifactError);
    try {
      artifacts.check();
    } catch (error) {
      expect((error as InstanceType<typeof MedicationArtifactError>).issues).toEqual([
        'public/meds-full.json is stale',
      ]);
    }
  });

  it('the committed artifacts match the canonical repository source', () => {
    const rootDir = path.join(__dirname, '..', '..');
    const artifacts = createMedicationArtifactModule(createNodeMedicationArtifactStore(rootDir));

    expect(() => artifacts.check()).not.toThrow();
    expect(fs.readFileSync(path.join(rootDir, 'data', 'meds.json'), 'utf8')).toContain(
      '"medications"',
    );
  });
});
