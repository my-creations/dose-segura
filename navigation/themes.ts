import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import { Colors } from '@/constants/Colors';

export const PastelLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.cardBackground,
    text: Colors.light.text,
  },
};

export const PastelDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.cardBackground,
    text: Colors.dark.text,
  },
};
