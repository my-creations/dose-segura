import {
  Medication,
  MedicationsData,
  MedicationsIndexData,
  MedicationSummary,
} from '@/types/medication';

export interface MedicationCatalog {
  readonly version: string;
  readonly lastUpdated: string;
  readonly medications: MedicationSummary[];
  getSummary(id: string): MedicationSummary | undefined;
  search(query: string): MedicationSummary[];
  getDetails(id: string): Promise<Medication | undefined>;
  warmDetails(): void;
}

export interface CreateMedicationCatalogOptions {
  index: MedicationsIndexData;
  loadFull: () => Promise<MedicationsData>;
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface SearchableMedication {
  medication: MedicationSummary;
  normalizedName: string;
  normalizedAliases: string[];
}

export function createMedicationCatalog({
  index,
  loadFull,
}: CreateMedicationCatalogOptions): MedicationCatalog {
  const medications = Object.values(index.medications);

  const searchable: SearchableMedication[] = medications.map((medication) => ({
    medication,
    normalizedName: normalizeSearchText(medication.name),
    normalizedAliases: medication.aliases.map(normalizeSearchText),
  }));

  return {
    version: index.version,
    lastUpdated: index.lastUpdated,
    medications,

    getSummary(id: string) {
      return index.medications[id];
    },

    search(query: string) {
      if (!query.trim()) {
        return medications;
      }

      const normalizedQuery = normalizeSearchText(query);

      return searchable
        .filter(
          ({ normalizedName, normalizedAliases }) =>
            normalizedName.includes(normalizedQuery) ||
            normalizedAliases.some((alias) => alias.includes(normalizedQuery)),
        )
        .map(({ medication }) => medication);
    },

    async getDetails(id: string) {
      const fullData = await loadFull();
      return fullData.medications[id];
    },

    warmDetails() {
      void loadFull().catch(() => {
        // Keep first navigation resilient if warmup fails.
      });
    },
  };
}
