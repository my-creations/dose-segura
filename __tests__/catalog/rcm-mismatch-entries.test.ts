import fs from 'fs';
import path from 'path';

type MedicationEntry = {
  compatibility?: unknown[];
  stability?: unknown[];
  nursingCare?: unknown[];
};

function loadMedications(): Record<string, MedicationEntry> {
  const rootDir = path.join(__dirname, '..', '..');
  const raw = fs.readFileSync(path.join(rootDir, 'data', 'meds.json'), 'utf8');
  return (JSON.parse(raw) as { medications: Record<string, MedicationEntry> }).medications;
}

/**
 * Guards the resolution of the three documental mismatches documented in
 * infarmed/non-high-risk-gap-review-2026-08-11.json:
 * - metilprednisolona-acetato + prednisolona-hemi-succinato: local artifact
 *   56266 is Metilprednisolona Hikma powder, not the catalog presentation.
 * - risperidona: INFOMED returned Okedi, not the catalog Risperdal Consta
 *   25/37.5/50 mg presentation.
 * All three resolved as leave-empty-pending-matching-rcm: no compatibility
 * or stability claim may be supported by the mismatched documents.
 */
describe('mismatched-RCM entries stay empty', () => {
  const ids = ['metilprednisolona-acetato', 'prednisolona-hemi-succinato', 'risperidona'];

  it.each(ids)('%s has empty compatibility and stability', (id) => {
    const medications = loadMedications();
    expect(medications[id]).toBeDefined();
    expect(medications[id].compatibility ?? []).toEqual([]);
    expect(medications[id].stability ?? []).toEqual([]);
  });

  it('metilprednisolona-acetato carries no dilute/mix instruction from the wrong artifact', () => {
    const entry = loadMedications()['metilprednisolona-acetato'];
    const care = (entry.nursingCare ?? []).join(' ').toLowerCase();
    expect(care).not.toMatch(/dilu[ií]da nem misturada/);
  });
});
