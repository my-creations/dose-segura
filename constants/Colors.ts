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
    text: '#F5F5F5',
    textDark: '#FFFFFF',
    background: '#1A1A2E',
    cardBackground: '#252542',
    tint: '#E8A0BF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#E8A0BF',
    // Section tile colors (slightly muted for dark mode)
    rose: '#C4879F',
    lavender: '#9BB8D8',
    mint: '#A8C49A',
    peach: '#D4B08C',
    sky: '#8AADD4',
    lilac: '#B49AC4',
    coral: '#D49494',
    cream: '#D4C9B8',
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
    classification: '#3A4A5A',
    compatibility: '#3A4A3A',
    presentationAndStorage: '#4A4538',
    preparation: '#3A4558',
    administration: '#4A3A42',
    stability: '#4A4038',
    contraindicationsAndPrecautions: '#4A3838',
    nursingCare: '#443A4A',
  },
};

export default Colors;
