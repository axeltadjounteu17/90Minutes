/**
 * 90Minutes — Spacing & Layout Tokens
 * 8px grid system per design-system.md
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Minimum touch target per Apple HIG */
export const MIN_TOUCH_TARGET = 44;

/** Safe area padding for notch/home indicator */
export const SAFE_AREA = {
  top: 48,
  bottom: 34,
} as const;
