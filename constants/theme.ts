import { Platform } from 'react-native';

export const COLORS = {
  // Brand
  primary: '#3B82F6',      // Blue
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',
  accent: '#F59E0B',       // Amber for highlights/upsets
  success: '#10B981',      // Green
  error: '#EF4444',        // Red
  warning: '#F59E0B',

  // Status badge colors
  live: '#10B981',         // Green
  upcoming: '#F59E0B',     // Amber
  completed: '#6B7280',    // Gray
  off_season: '#374151',   // Dark gray

  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceAlt: '#F3F4F6',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    card: '#FFFFFF',
    skeleton: '#E5E7EB',
    skeletonHighlight: '#F9FAFB',
  },

  // Dark theme
  dark: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceAlt: '#21262D',
    border: '#30363D',
    text: '#F0F6FC',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',
    tabBar: '#161B22',
    tabBarBorder: '#30363D',
    card: '#161B22',
    skeleton: '#21262D',
    skeletonHighlight: '#30363D',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const SHADOW = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
