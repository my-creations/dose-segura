import medsIndexData from '@/data/meds-index.json';
import medsData from '@/data/meds.json';
import { createMedicationCatalog } from '@/catalog/createMedicationCatalog';
import { MedicationsData, MedicationsIndexData } from '@/types/medication';

describe('createMedicationCatalog', () => {
  const catalog = createMedicationCatalog({
    index: medsIndexData as MedicationsIndexData,
    loadFull: async () => medsData as MedicationsData,
  });

  it('lists all index medications', () => {
    expect(catalog.medications.length).toBe(
      Object.keys((medsIndexData as MedicationsIndexData).medications).length,
    );
  });

  it('returns all medications for an empty query', () => {
    expect(catalog.search('')).toHaveLength(catalog.medications.length);
    expect(catalog.search('   ')).toHaveLength(catalog.medications.length);
  });

  it('matches medication names regardless of case and accents', () => {
    const results = catalog.search('acetilcisteina');
    expect(results.some((med) => med.id === 'acetilcisteina')).toBe(true);
  });

  it('matches medication aliases', () => {
    const results = catalog.search('nac');
    expect(results.some((med) => med.id === 'acetilcisteina')).toBe(true);
  });

  it('returns no results when query does not match', () => {
    expect(catalog.search('medicamento-inexistente-xyz')).toHaveLength(0);
  });

  it('loads medication details on demand', async () => {
    await expect(catalog.getDetails('acetilcisteina')).resolves.toMatchObject({
      id: 'acetilcisteina',
      name: 'Acetilcisteína',
    });
  });

  it('returns medication details that match the source JSON record', async () => {
    const expected = (medsData as MedicationsData).medications.acetilcisteina;
    await expect(catalog.getDetails('acetilcisteina')).resolves.toEqual(expected);
  });

  it('getSummary returns index projection', () => {
    expect(catalog.getSummary('acetilcisteina')).toMatchObject({
      id: 'acetilcisteina',
      name: 'Acetilcisteína',
    });
  });
});
