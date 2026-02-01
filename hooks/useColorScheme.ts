import { useTheme } from '@/context/ThemeContext';

export function useColorScheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}
