import type { HTMLAttributes } from "vue";

interface LayoutProps {
  variant?: "default" | "enclosed" | "full";
  minimal?: boolean;
}

interface VariantProps {
  class?: HTMLAttributes["class"];
  uiConfig?: Record<string, any>;
  minimal?: boolean;
  title?: string;
  asideTitle?: string;
}

export type { LayoutProps, VariantProps };
