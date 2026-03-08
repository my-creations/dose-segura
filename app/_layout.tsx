import { Platform } from 'react-native';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  if (Platform.OS === 'web') {
    const WebRootLayout = require('./_layout.web').default;
    return <WebRootLayout />;
  }

  const NativeRootLayout = require('./_layout.native').default;
  return <NativeRootLayout />;
}
