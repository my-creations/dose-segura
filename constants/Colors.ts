// Pastel color palette - feminine, soft, and friendly
export const Colors = {
  light: {
    text: '#5D5D5D',
    textDark: '#3D3D3D',
    background: '#FFF9F9',
    cardBackground: '#FFFFFF',
    tint: '#E8A0BF',
    /** Foreground to place ON a `tint` surface (5.28:1). `tint` is light in both themes. */
    onTint: '#3D3D3D',
    /** Accent for text/icons on normal surfaces (>=4.5:1 on card, background and tinted chips). */
    tintText: '#A34B70',
    icon: '#767676',
    tabIconDefault: '#767676',
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
    /** `tint` is light in dark mode too, so the on-tint foreground stays dark (9.17:1). */
    onTint: '#232527',
    /** Dark mode already has a light pink accent, so it doubles as the accent text colour. */
    tintText: '#FFB3C6',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
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
