import {
  MEDICATION_SECTIONS,
  sectionColor,
  sectionI18nKey,
  sectionsOf,
} from '@/catalog/medicationSections';
import { Medication } from '@/types/medication';

const sample: Medication = {
  id: 'sample',
  name: 'Sample',
  aliases: [],
  highRisk: false,
  classification: ['A'],
  compatibility: [],
  presentationAndStorage: ['Store cold'],
  preparation: [],
  administration: ['IV'],
  stability: [],
  contraindicationsAndPrecautions: [],
  nursingCare: [],
};

describe('medicationSections', () => {
  it('keeps a stable ordered catalog of sections', () => {
    expect(MEDICATION_SECTIONS).toHaveLength(8);
    expect(MEDICATION_SECTIONS[0]).toBe('classification');
    expect(MEDICATION_SECTIONS[7]).toBe('nursingCare');
  });

  it('sectionsOf drops empty sections and preserves order', () => {
    expect(sectionsOf(sample)).toEqual([
      { key: 'classification', data: ['A'] },
      { key: 'presentationAndStorage', data: ['Store cold'] },
      { key: 'administration', data: ['IV'] },
    ]);
  });

  it('builds i18n keys and colors', () => {
    expect(sectionI18nKey('administration')).toBe('medication.sections.administration');
    expect(sectionColor('administration', 'light')).toBe('#E8A0BF');
    expect(sectionColor('administration', 'dark')).toBe('#5C3A46');
  });
});
