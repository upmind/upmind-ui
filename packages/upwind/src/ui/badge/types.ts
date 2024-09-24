// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { badgeVariants } from "./badge.config";
type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export interface BadgeProps {
  label?: string;
  // --- variants
  color?: BadgeVariantProps["color"];
  variant?: BadgeVariantProps["variant"];
  // --- styles
  upwindConfig?: { badge: Partial<BadgeProps> };
  class?: HTMLAttributes["class"];
}
