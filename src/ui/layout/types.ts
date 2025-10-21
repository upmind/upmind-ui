import type { CxOptions } from "class-variance-authority";

export interface LayoutProps {
  variant?:
    | "default"
    | "enclosed"
    | "full"
    | "two-column-LTR"
    | "two-column-RTL";
  minimal?: boolean;
  overflow?: "hidden" | "visible";
  sticky?: boolean;
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

export const enum LAYOUT_VARIANTS {
  DEFAULT = "default",
  ENCLOSED = "enclosed",
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-LTR",
  TWO_COLUMN_RTL = "two-column-RTL"
}
