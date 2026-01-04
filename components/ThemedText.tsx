import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'sectionTitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles.base,
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'sectionTitle' ? styles.sectionTitle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Quicksand_400Regular',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Quicksand_600SemiBold',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_600SemiBold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Quicksand_400Regular',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
