import type { HTMLAttributes } from "vue";

export interface LayoutProps {
  variant?: "default" | "enclosed" | "full";
  minimal?: boolean;
  overflow?: "hidden" | "visible";
}
export interface VariantProps {
  uiConfig?: Record<string, any>;
  minimal?: boolean;
  overflow?: "hidden" | "visible";
}
export interface SectionProps {
  title?: string;
  as?: string;
  variant?: LayoutProps["variant"];
}
