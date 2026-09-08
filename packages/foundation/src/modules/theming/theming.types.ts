/**
 * @module foundation/theming
 * @description Brand→theme selection. ADR 023 §2 keeps the engine in `ui`.
 */

export const COLOR_SCHEME = {
  LIGHT: "light",
  DARK: "dark"
} as const;

export type ColorScheme = (typeof COLOR_SCHEME)[keyof typeof COLOR_SCHEME];

/**
 * The theme engine and active-theme store `ui` owns. `foundation` selects a
 * theme id and hands it over; implementing `set` here would invert the layer.
 */
export type ThemeEngine = {
  set: (id: string) => void;
};

export type BrandThemeMeta = {
  isAvailable: boolean;
  hasThemes: boolean;
};
