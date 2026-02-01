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
    tint: '#FFB3C6', // Lighter pastel pink for contrast
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFB3C6',
    // Section tile colors (Darkened versions of pastels for contrast)
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

// Section key type for consistent typing
export type SectionKey = 
  | 'classification'
  | 'compatibility'
  | 'presentationAndStorage'
  | 'preparation'
  | 'administration'
  | 'stability'
  | 'contraindicationsAndPrecautions'
  | 'nursingCare';

// Tile color assignments for each section - maps to actual color values
export const SECTION_COLORS: Record<'light' | 'dark', Record<SectionKey, string>> = {
  light: {
    classification: '#C5DFF8',    // lavender
    compatibility: '#D4E7C5',     // mint
    presentationAndStorage: '#FFF5E4', // cream
    preparation: '#B4D4FF',       // sky
    administration: '#E8A0BF',    // rose
    stability: '#FFD9B7',         // peach
    contraindicationsAndPrecautions: '#FFB5B5', // coral
    nursingCare: '#DBC4F0',       // lilac
  },
  dark: {
    classification: '#3A475C',    // Dark Lavender
    compatibility: '#3A4C3C',     // Dark Mint
    presentationAndStorage: '#4C4638', // Dark Cream
    preparation: '#324A5E',       // Dark Sky
    administration: '#5C3A46',    // Dark Rose
    stability: '#5C483A',         // Dark Peach
    contraindicationsAndPrecautions: '#5C3A3A', // Dark Coral
    nursingCare: '#4A3A5C',       // Dark Lilac
  },
};

export default Colors;
