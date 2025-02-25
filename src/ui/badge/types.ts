// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { badgeVariants } from "./badge.config";
type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export interface BadgeProps {
  label?: string;
  // --- variants
  color?: BadgeVariantProps["color"] | string;
  variant?: BadgeVariantProps["variant"] | string;
  size?: BadgeVariantProps["size"] | string;
  // --- styles
  uiConfig?: { badge: CxOptions };
  class?: HTMLAttributes["class"];
}
