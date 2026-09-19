import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const mockScheme = { current: 'light' as 'light' | 'dark' };

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => mockScheme.current,
}));

/**
 * WCAG 2.1 contrast guards for the semantic palette tokens.
 *
 * These lock in the ratios that the light theme previously failed (white on `tint`
 * buttons, `icon`/`tabIconDefault` greys, `tint` as accent text, the high-risk badge)
 * plus the dark theme's `rose`-as-foreground misuse. Palette edits that regress
 * readability now fail here instead of shipping.
 */

type Hex = string;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: Hex): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: Hex, background: Hex): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Flatten a translucent foreground over an opaque background (what the eye sees). */
function composite(foreground: Hex, background: Hex, alpha: number): Hex {
  const f = foreground.replace('#', '');
  const b = background.replace('#', '');
  const mix = [0, 2, 4].map((i) =>
    Math.round(
      alpha * parseInt(f.slice(i, i + 2), 16) + (1 - alpha) * parseInt(b.slice(i, i + 2), 16),
    ),
  );
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const TEXT_MIN = 4.5;
const UI_MIN = 3;

describe.each(['light', 'dark'] as const)('%s theme contrast', (scheme) => {
  const c = Colors[scheme];
  const onCard = (fg: Hex) => contrast(fg, c.cardBackground);

  it('body text meets AA on both surfaces', () => {
    expect(onCard(c.text)).toBeGreaterThanOrEqual(TEXT_MIN);
    expect(contrast(c.text, c.background)).toBeGreaterThanOrEqual(TEXT_MIN);
    expect(onCard(c.textDark)).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('onTint text is readable on tint-filled buttons and chips', () => {
    // `tint` is a light pastel in BOTH themes, so the on-tint foreground must stay dark.
    expect(contrast(c.onTint, c.tint)).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('tintText accent is readable on plain and tinted surfaces', () => {
    expect(onCard(c.tintText)).toBeGreaterThanOrEqual(TEXT_MIN);
    expect(contrast(c.tintText, c.background)).toBeGreaterThanOrEqual(TEXT_MIN);
    // Selected options/chips put accent text on a translucent tint wash.
    expect(contrast(c.tintText, composite(c.tint, c.cardBackground, 0.2))).toBeGreaterThanOrEqual(
      TEXT_MIN,
    );
    expect(contrast(c.tintText, composite(c.tint, c.cardBackground, 0.28))).toBeGreaterThanOrEqual(
      TEXT_MIN,
    );
  });

  it('muted and tab icons clear the 3:1 non-text threshold', () => {
    expect(onCard(c.icon)).toBeGreaterThanOrEqual(UI_MIN);
    expect(contrast(c.icon, c.background)).toBeGreaterThanOrEqual(UI_MIN);
    expect(onCard(c.tabIconDefault)).toBeGreaterThanOrEqual(UI_MIN);
  });

  it('high-risk badge text is readable on the coral fill', () => {
    expect(contrast(c.textDark, c.coral)).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('favourite hearts are readable in both states', () => {
    expect(onCard(c.tintText)).toBeGreaterThanOrEqual(UI_MIN);
    expect(onCard(c.icon)).toBeGreaterThanOrEqual(UI_MIN);
  });
});

describe('caption text contrast', () => {
  it.each(['light', 'dark'] as const)('%s captions stay readable at their opacity', (scheme) => {
    mockScheme.current = scheme;
    render(<ThemedText type="caption">caption</ThemedText>);
    const style = StyleSheet.flatten(screen.getByText('caption').props.style) as {
      opacity?: number;
    };
    const alpha = style.opacity ?? 1;
    const c = Colors[scheme];
    const rendered = composite(c.text, c.cardBackground, alpha);
    expect(contrast(rendered, c.cardBackground)).toBeGreaterThanOrEqual(TEXT_MIN);
  });
});
