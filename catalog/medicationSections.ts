import { Medication, MedicationSection } from '@/types/medication';

export type { MedicationSection };
/** @deprecated Use MedicationSection */
export type SectionKey = MedicationSection;

export const MEDICATION_SECTIONS: readonly MedicationSection[] = [
  'classification',
  'compatibility',
  'presentationAndStorage',
  'preparation',
  'administration',
  'stability',
  'contraindicationsAndPrecautions',
  'nursingCare',
] as const;

export interface MedicationSectionView {
  key: MedicationSection;
  data: string[];
}

/** Tile colors per section for light/dark Resolved Theme. */
export const SECTION_COLORS: Record<'light' | 'dark', Record<MedicationSection, string>> = {
  light: {
    classification: '#C5DFF8',
    compatibility: '#D4E7C5',
    presentationAndStorage: '#FFF5E4',
    preparation: '#B4D4FF',
    administration: '#E8A0BF',
    stability: '#FFD9B7',
    contraindicationsAndPrecautions: '#FFB5B5',
    nursingCare: '#DBC4F0',
  },
  dark: {
    classification: '#3A475C',
    compatibility: '#3A4C3C',
    presentationAndStorage: '#4C4638',
    preparation: '#324A5E',
    administration: '#5C3A46',
    stability: '#5C483A',
    contraindicationsAndPrecautions: '#5C3A3A',
    nursingCare: '#4A3A5C',
  },
};

export function sectionColor(section: MedicationSection, scheme: 'light' | 'dark'): string {
  return SECTION_COLORS[scheme][section];
}

export function sectionI18nKey(section: MedicationSection): string {
  return `medication.sections.${section}`;
}

/** Non-empty sections of a Medication, in display order. */
export function sectionsOf(medication: Medication): MedicationSectionView[] {
  return MEDICATION_SECTIONS.map((key) => ({
    key,
    data: medication[key],
  })).filter((section) => section.data.length > 0);
}
