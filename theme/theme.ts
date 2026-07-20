export const THEME_STORAGE_KEY = 'dose_segura_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function parseThemeMode(raw: string | null): ThemeMode {
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

export function resolveTheme(
  mode: ThemeMode,
  systemTheme: ResolvedTheme | null | undefined,
): ResolvedTheme {
  if (mode === 'system') {
    return systemTheme ?? 'light';
  }
  return mode;
}

/** Web document chrome for Resolved Theme. No-op when document is unavailable. */
export function applyDocumentTheme(resolvedTheme: ResolvedTheme, backgroundColor: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-theme', resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;
  document.body.style.backgroundColor = backgroundColor;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', backgroundColor);
}
