/**
 * 90Minutes — Typography Tokens
 * Per design-system.md
 *
 * Fonts:
 * - Display/Headlines: Oswald (bold, condensed, sport)
 * - Body: Inter (clean, modern)
 * - Monospace: JetBrains Mono (scores, stats)
 */

import { TextStyle } from 'react-native';

export const FONTS = {
  display: 'Oswald',
  body: 'Inter',
  mono: 'JetBrainsMono',
} as const;

export const TYPOGRAPHY: Record<string, TextStyle> = {
  displayXl: {
    fontFamily: FONTS.display,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  displayLg: {
    fontFamily: FONTS.display,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  headingLg: {
    fontFamily: FONTS.display,
    fontSize: 28,
    fontWeight: '600',
  },
  headingMd: {
    fontFamily: FONTS.body,
    fontSize: 22,
    fontWeight: '600',
  },
  headingSm: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: FONTS.body,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  bodySm: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  score: {
    fontFamily: FONTS.mono,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  stat: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    fontWeight: '500',
  },
};
