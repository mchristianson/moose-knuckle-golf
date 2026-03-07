/**
 * Design System Color Palette
 * 8-color system with semantic naming
 */

export const colors = {
  // Primary - Forest Green
  PRIMARY: "#1B4D2E",
  PRIMARY_DARK: "#152B21",
  PRIMARY_LIGHT: "#2D6A45",

  // Secondary - Teal
  SECONDARY: "#2B8A8A",
  SECONDARY_DARK: "#1F6366",
  SECONDARY_LIGHT: "#41A8A8",

  // Semantic colors
  SUCCESS: "#16A34A",
  WARNING: "#EAB308",
  DANGER: "#DC2626",

  // Neutral palette
  NEUTRAL_50: "#F5F1E8",  // Cream background
  NEUTRAL_100: "#F3F4F6", // Light gray cards/dividers
  NEUTRAL_400: "#9CA3AF", // Medium gray secondary text
  NEUTRAL_700: "#374151", // Dark gray body text
  NEUTRAL_900: "#111827", // Near black headings
} as const;

/**
 * CSS variables for use in tailwind config and global styles
 */
export const colorVars = {
  "--color-primary": colors.PRIMARY,
  "--color-primary-dark": colors.PRIMARY_DARK,
  "--color-primary-light": colors.PRIMARY_LIGHT,
  "--color-secondary": colors.SECONDARY,
  "--color-secondary-dark": colors.SECONDARY_DARK,
  "--color-secondary-light": colors.SECONDARY_LIGHT,
  "--color-success": colors.SUCCESS,
  "--color-warning": colors.WARNING,
  "--color-danger": colors.DANGER,
  "--color-neutral-50": colors.NEUTRAL_50,
  "--color-neutral-100": colors.NEUTRAL_100,
  "--color-neutral-400": colors.NEUTRAL_400,
  "--color-neutral-700": colors.NEUTRAL_700,
  "--color-neutral-900": colors.NEUTRAL_900,
} as const;
