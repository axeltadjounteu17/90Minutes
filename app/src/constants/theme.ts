/**
 * 90Minutes — Theme Tokens
 * Design system tokens for Dark & Light themes.
 * Per design-system.md and theming.md
 *
 * RULES:
 * - NEVER hardcode colors in components — always use theme tokens
 * - Accent colors NEVER change between themes (brand identity)
 * - Default is Dark (Adidas brand)
 */

export interface Theme {
  name: 'dark' | 'light';

  // Backgrounds
  bgPrimary: string;
  bgCard: string;
  bgElevated: string;
  bgInput: string;
  bgHover: string;
  bgNavbar: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textOnAccent: string;

  // Accents (same in both themes — brand identity)
  accentPrimary: string;
  accentSecondary: string;
  accentWarm: string;

  // Semantic
  success: string;
  warning: string;
  danger: string;
  live: string;

  // Borders & Separators
  border: string;
  separator: string;
}

export const darkTheme: Theme = {
  name: 'dark',

  bgPrimary: '#0A0A0A',
  bgCard: '#111111',
  bgElevated: '#1A1A1A',
  bgInput: '#1E1E1E',
  bgHover: '#2A2A2A',
  bgNavbar: '#0A0A0A',

  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textTertiary: '#666666',
  textDisabled: '#444444',
  textOnAccent: '#FFFFFF',

  accentPrimary: '#E3001B',
  accentSecondary: '#FF6B00',
  accentWarm: '#FFB800',

  success: '#00C853',
  warning: '#FFC107',
  danger: '#E3001B',
  live: '#E3001B',

  border: '#1A1A1A',
  separator: 'rgba(255,255,255,0.06)',
};

export const lightTheme: Theme = {
  name: 'light',

  bgPrimary: '#F5F5F5',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgInput: '#F0F0F0',
  bgHover: '#E8E8E8',
  bgNavbar: '#FFFFFF',

  textPrimary: '#0A0A0A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  textOnAccent: '#FFFFFF',

  accentPrimary: '#E3001B',
  accentSecondary: '#FF6B00',
  accentWarm: '#FFB800',

  success: '#00C853',
  warning: '#FFC107',
  danger: '#E3001B',
  live: '#E3001B',

  border: '#E0E0E0',
  separator: 'rgba(0,0,0,0.08)',
};
