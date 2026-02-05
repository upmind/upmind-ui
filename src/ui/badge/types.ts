// --- external
import type { badgeVariants } from "./badge.config";
import type { Icon } from "../icon/types";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- internal

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export interface BadgeProps {
  label?: string;
  icon?: string | Icon;
  appendIcon?: string | Icon;
  close?: boolean;
  // --- variants
  color?: BadgeVariantProps["color"];
  variant?: BadgeVariantProps["variant"];
  size?: BadgeVariantProps["size"];
  // --- styles
  uiConfig?: { badge: CxOptions };
  class?: HTMLAttributes["class"];
}
