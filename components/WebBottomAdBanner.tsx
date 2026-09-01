import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useCookieConsent } from '@/context/CookieConsentContext';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const BANNER_HEIGHT = 50;
const WEB_ADS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_WEB_ADS === 'true';
const ADSENSE_CLIENT_ID = process.env.EXPO_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_TABBAR_SLOT_ID = process.env.EXPO_PUBLIC_ADSENSE_TABBAR_SLOT_ID;
const SHOW_AD_PLACEHOLDER = process.env.EXPO_PUBLIC_SHOW_AD_PLACEHOLDER === 'true';
const ADSENSE_SCRIPT_ID = 'dose-segura-adsense-script';

export function WebBottomAdBanner() {
  const { canUseAdvertisingCookies } = useCookieConsent();
  const adInitializedRef = useRef(false);
  const hasLiveAdConfig = Boolean(ADSENSE_CLIENT_ID) && Boolean(ADSENSE_TABBAR_SLOT_ID);
  const shouldShowPlaceholder = SHOW_AD_PLACEHOLDER && Platform.OS === 'web' && WEB_ADS_ENABLED;
  const shouldRenderBanner =
    Platform.OS === 'web' &&
    WEB_ADS_ENABLED &&
    ((hasLiveAdConfig && canUseAdvertisingCookies) || shouldShowPlaceholder);
  const shouldLoadLiveAd =
    shouldRenderBanner && hasLiveAdConfig && canUseAdvertisingCookies && !shouldShowPlaceholder;

  useEffect(() => {
    if (!shouldLoadLiveAd || typeof window === 'undefined') {
      return;
    }

    const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    const existingScript = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = scriptSrc;
      document.head.appendChild(script);
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      if (adInitializedRef.current) {
        window.clearInterval(intervalId);
        return;
      }

      if (!Array.isArray(window.adsbygoogle)) {
        attempts += 1;
        if (attempts > 20) {
          window.clearInterval(intervalId);
        }
        return;
      }

      try {
        window.adsbygoogle.push({});
        adInitializedRef.current = true;
      } catch {
        // Keep the app usable even if ad loading fails.
      } finally {
        window.clearInterval(intervalId);
      }
    }, 350);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldLoadLiveAd]);

  if (!shouldRenderBanner) {
    return null;
  }

  return (
    <View style={styles.container} testID="web-bottom-ad-banner">
      <View style={styles.frame}>
        {shouldLoadLiveAd ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: `${BANNER_HEIGHT}px` }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={ADSENSE_TABBAR_SLOT_ID}
            data-ad-format="horizontal"
            data-full-width-responsive="false"
          />
        ) : shouldShowPlaceholder ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Publicidade</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  frame: {
    height: BANNER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  placeholder: {
    height: BANNER_HEIGHT,
    width: '100%',
    backgroundColor: '#F5E8EF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E8A0BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#A0607A',
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
    letterSpacing: 0.4,
  },
});
