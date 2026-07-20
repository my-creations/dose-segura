// Pastel color palette - feminine, soft, and friendly
export const Colors = {
  light: {
    text: '#5D5D5D',
    textDark: '#3D3D3D',
    background: '#FFF9F9',
    cardBackground: '#FFFFFF',
    tint: '#E8A0BF',
    icon: '#B8B8B8',
    tabIconDefault: '#C4C4C4',
    tabIconSelected: '#E8A0BF',
    // Section tile colors
    rose: '#E8A0BF',
    lavender: '#C5DFF8',
    mint: '#D4E7C5',
    peach: '#FFD9B7',
    sky: '#B4D4FF',
    lilac: '#DBC4F0',
    coral: '#FFB5B5',
    cream: '#FFF5E4',
  },
  dark: {
    text: '#ECEDEE',
    textDark: '#FFFFFF',
    background: '#151718',
    cardBackground: '#232527',
    tint: '#FFB3C6',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFB3C6',
    rose: '#5C3A46',
    lavender: '#3A475C',
    mint: '#3A4C3C',
    peach: '#5C483A',
    sky: '#324A5E',
    lilac: '#4A3A5C',
    coral: '#5C3A3A',
    cream: '#4C4638',
  },
};

/** @deprecated Import from `@/catalog/medicationSections`. */
export type { SectionKey } from '@/catalog/medicationSections';
/** @deprecated Import from `@/catalog/medicationSections`. */
export { SECTION_COLORS } from '@/catalog/medicationSections';

export default Colors;
