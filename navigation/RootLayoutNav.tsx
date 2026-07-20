import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PastelDarkTheme, PastelLightTheme } from '@/navigation/themes';
import i18n from '@/utils/i18n';

export function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
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
  );
}
