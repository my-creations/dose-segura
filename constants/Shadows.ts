import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = ViewStyle;

function createCardShadow(options: {
  iosColor: string;
  iosOffsetHeight: number;
  iosOpacity: number;
  iosRadius: number;
  androidElevation: number;
  webShadow: string;
}): ShadowStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: options.iosColor,
      shadowOffset: { width: 0, height: options.iosOffsetHeight },
      shadowOpacity: options.iosOpacity,
      shadowRadius: options.iosRadius,
    };
  }

  if (Platform.OS === 'android') {
    return {
      elevation: options.androidElevation,
    };
  }

  if (Platform.OS === 'web') {
    return {
      boxShadow: options.webShadow,
    } as ShadowStyle;
  }

  return {};
}

export const pastelCardShadow = createCardShadow({
  iosColor: '#E8A0BF',
  iosOffsetHeight: 2,
  iosOpacity: 0.1,
  iosRadius: 6,
  androidElevation: 2,
  webShadow: '0px 2px 6px rgba(232, 160, 191, 0.1)',
});

export const pastelCardShadowStrong = createCardShadow({
  iosColor: '#E8A0BF',
  iosOffsetHeight: 3,
  iosOpacity: 0.12,
  iosRadius: 8,
  androidElevation: 3,
  webShadow: '0px 3px 8px rgba(232, 160, 191, 0.12)',
});

export const modalShadow = createCardShadow({
  iosColor: '#000000',
  iosOffsetHeight: 2,
  iosOpacity: 0.25,
  iosRadius: 4,
  androidElevation: 5,
  webShadow: '0px 10px 30px rgba(0, 0, 0, 0.2)',
});
