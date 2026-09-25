/**
 * @module foundation/theming
 * @description Brand→theme selection.
 */

export type ThemeEngine = {
  set: (id: string) => void;
};
