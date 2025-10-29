import type { CxOptions } from "class-variance-authority";

export interface LayoutProps {
  variant?: LAYOUT_VARIANTS;
  minimal?: boolean;
  overflow?: "hidden" | "visible";
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
  DEFAULT = "default",
  ENCLOSED = "enclosed",
  FULL = "full",
  TWO_COLUMN_LTR = "twoColumnLTR",
  TWO_COLUMN_RTL = "twoColumnRTL",
  SPLIT = "split",
  CANVAS_CARD = "canvasCard",
  SURFACE_BOX = "surfaceBox"
}
