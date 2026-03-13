import type { CxOptions } from "class-variance-authority";

export interface LayoutProps {
  variant?: LAYOUT_VARIANTS;
  minimal?: boolean;
  class?: string;
}
export interface VariantProps extends LayoutProps {
  uiConfig?: { layout: CxOptions };
}
export interface SectionProps {
  title?: string;
  as?: string;
  variant?: LayoutProps["variant"];
}

export enum LAYOUT_VARIANTS {
  FULL = "full",
  TWO_COLUMN_LTR = "twoColumnLTR",
  TWO_COLUMN_RTL = "twoColumnRTL",
  SPLIT_VERTICAL = "splitVertical",
  SPLIT_HORIZONTAL = "splitHorizontal",
  CANVAS_CARD = "canvasCard",
  SURFACE_BOX = "surfaceBox"
}

export enum LAYOUT_MODE {
  GROW = "grow",
  CENTERED = "centered"
}

export enum LAYOUT_OVERFLOW {
  HIDDEN = "hidden",
  VISIBLE = "visible"
}

export type UseLayoutProps = {
  /**
   * The current layout variant.
   * - DEFAULT: Default layout variant.
   * - FULL: Full layout variant.
   * - TWO_COLUMN_LTR: Two column layout variant (left to right).
   * - TWO_COLUMN_RTL: Two column layout variant (right to left).
   * - SPLIT: Split layout variant.
   * - CANVAS_CARD: Canvas card layout variant.
   * - SURFACE_BOX: Surface box layout variant.
   * @default LAYOUT_VARIANTS.FULL
   */
  variant?: LAYOUT_VARIANTS;
  /**
   * Layout mode for the main element.
   * - GROW: The main element stretches to fill available space, pushing header to top and footer to bottom.
   * - CENTERED: The main element is centered vertically and horizontally.
   * @default LAYOUT_MODE.GROW
   */
  mode?: LAYOUT_MODE;
  /**
   * The current layout overflow.
   * - HIDDEN: The main element overflow is hidden.
   * - VISIBLE: The main element overflow is visible.
   * @default LAYOUT_OVERFLOW.VISIBLE
   */
  overflow?: LAYOUT_OVERFLOW;
  /**
   * Whether the layout should show the content and aside footer.
   * @default true
   */
  footer?: boolean;
};
