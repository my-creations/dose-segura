import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { MedicationsProvider } from '@/context/MedicationsContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom theme with pastel colors
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
  const [loaded, error] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          Quicksand_400Regular,
          Quicksand_500Medium,
          Quicksand_600SemiBold,
          Quicksand_700Bold,
        }
  );
  const fontsReady = loaded || Platform.OS === 'web';

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (Platform.OS !== 'web' && loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!fontsReady) {
    return null;
  }

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
