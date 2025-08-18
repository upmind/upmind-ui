import type { HTMLAttributes } from "vue";

export interface LayoutProps {
  variant?: "default" | "enclosed" | "full";
  minimal?: boolean;
  overflow?: "hidden" | "visible";
  sticky?: boolean;
}
export interface VariantProps extends LayoutProps {
  uiConfig?: Record<string, any>;
}
export interface SectionProps {
  title?: string;
  as?: string;
  variant?: LayoutProps["variant"];
}
