import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { AppProviders } from '@/context/AppProviders';
import { RootLayoutNav } from '@/navigation/RootLayoutNav';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/** Fallback layout (web + any platform without a more specific file). */
export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
      <CookieConsentBanner />
    </AppProviders>
  );
}
