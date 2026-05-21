import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { MedicationsProvider } from '@/context/MedicationsContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const PastelLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.cardBackground,
    text: Colors.light.text,
  },
};

const PastelDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.cardBackground,
    text: Colors.dark.text,
  },
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <MedicationsProvider>
      <FavoritesProvider>
        <ThemeProvider value={colorScheme === 'dark' ? PastelDarkTheme : PastelLightTheme}>
          <Stack
            screenOptions={{
              headerTitleStyle: {
                fontFamily: 'Quicksand_600SemiBold',
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="medication/[id]"
              options={{
                headerShown: true,
                title: i18n.t('navigation.medication'),
                headerTintColor: Colors[colorScheme ?? 'light'].tint,
                headerBackTitle: i18n.t('common.back'),
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </FavoritesProvider>
    </MedicationsProvider>
  );
}
