import { parseThemeMode, resolveTheme, THEME_STORAGE_KEY } from '@/theme/theme';

describe('theme', () => {
  it('exposes stable storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('dose_segura_theme_preference');
  });

  it('parses known modes and falls back to system', () => {
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('system')).toBe('system');
    expect(parseThemeMode(null)).toBe('system');
    expect(parseThemeMode('nope')).toBe('system');
  });

  it('resolves system against OS theme', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', null)).toBe('light');
  });
});
