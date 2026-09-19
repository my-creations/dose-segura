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
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen
          name="procedure/[id]"
          options={{
            headerShown: true,
            title: i18n.t('navigation.procedure'),
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen
          name="procedure/form"
          options={{
            headerShown: true,
            title: i18n.t('navigation.procedureForm'),
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen
          name="procedure/catalog"
          options={{
            headerShown: true,
            title: i18n.t('navigation.procedureCatalog'),
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            headerShown: true,
            title: i18n.t('navigation.privacy'),
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            title: i18n.t('navigation.terms'),
            headerTintColor: Colors[colorScheme ?? 'light'].tintText,
            headerBackTitle: i18n.t('common.back'),
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
