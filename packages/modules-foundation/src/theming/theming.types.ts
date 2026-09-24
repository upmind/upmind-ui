/**
 * @module foundation/theming
 * @description Brand→theme selection.
 */

export const COLOR_SCHEME = {
  LIGHT: "light",
  DARK: "dark"
} as const;

export type ColorScheme = (typeof COLOR_SCHEME)[keyof typeof COLOR_SCHEME];

export type ThemeEngine = {
  set: (id: string) => void;
};

export type BrandThemeMeta = {
  isAvailable: boolean;
  hasThemes: boolean;
};
