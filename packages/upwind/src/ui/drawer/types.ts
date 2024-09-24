// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { containerVariant } from "./drawer.config";
type DrawerContentVariantProps = VariantProps<typeof containerVariant>;

export interface DrawerProps {
  title?: string;
  description?: string;
  showClose?: boolean;
  // --- variants
  maxWidth?: DrawerContentVariantProps["maxWidth"];
  // --- styles
  upwindConfig?: { alert: Partial<DrawerProps> };
  class?: HTMLAttributes["class"];
}
