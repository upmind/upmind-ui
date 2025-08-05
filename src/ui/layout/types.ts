import type { HTMLAttributes } from "vue";

export interface LayoutProps {
  variant?: "default" | "enclosed" | "full";
  minimal?: boolean;
}
export interface VariantProps {
  uiConfig?: Record<string, any>;
  minimal?: boolean;
}
export interface SectionProps {
  title?: string;
  as?: string;
  class?: HTMLAttributes["class"];
  variant?: LayoutProps["variant"];
}
