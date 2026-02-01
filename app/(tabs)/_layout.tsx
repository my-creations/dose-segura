import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/utils/i18n';

function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.lavender,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Quicksand_500Medium',
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: colors.cardBackground,
        },
        headerTitleStyle: {
          fontFamily: 'Quicksand_600SemiBold',
          color: colors.text,
        },
        headerTintColor: colors.tint,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t('navigation.medications'),
          tabBarIcon: ({ color }) => <TabBarIcon name="medical" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: i18n.t('navigation.favorites'),
          tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t('navigation.settings'),
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
