export const LAYOUT_MODE = {
  GROW: "grow",
  CENTERED: "centered"
} as const;

export type LayoutMode = (typeof LAYOUT_MODE)[keyof typeof LAYOUT_MODE];

export type LayoutProps = {
  /**
   * Layout mode for the main element.
   * - GROW: The main element stretches to fill available space, pushing header to top and footer to bottom.
   * - CENTERED: The main element is centered vertically and horizontally.
   * @default LAYOUT_MODE.GROW
   */
  mode?: LayoutMode;
};
