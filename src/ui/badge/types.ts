// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { badgeVariants } from "./badge.config";
type BadgeVariantProps = VariantProps<typeof badgeVariants>;

// --- types
import { type Icon } from "../icon/types";

export interface BadgeProps {
  label?: string;
  icon?: string | Icon;
  appendIcon?: string | Icon;
  // --- variants
  color?: BadgeVariantProps["color"];
  variant?: BadgeVariantProps["variant"];
  size?: BadgeVariantProps["size"];
  // --- styles
  uiConfig?: { badge: CxOptions };
  class?: HTMLAttributes["class"];
}
