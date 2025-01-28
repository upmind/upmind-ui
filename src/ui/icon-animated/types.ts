import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { iconVariants } from "./iconAnimated.config";
type IconVariantProps = VariantProps<typeof iconVariants>;

// --- types
export interface AnimatedIconProps {
  icon: string;
  trigger?: string;
  sequence?: string;
  delay?: number;
  // ---
  size?: IconVariantProps["size"];
  // ---
  uiConfig?: { iconAnimated: Partial<AnimatedIconProps> };
  class?: HTMLAttributes["class"];
}
