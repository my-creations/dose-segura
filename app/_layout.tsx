import { RootLayoutNav } from '@/navigation/RootLayoutNav';
import { AppProviders } from '@/context/AppProviders';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/** Fallback layout (web + any platform without a more specific file). */
export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
