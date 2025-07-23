// --- external
import type { CxOptions } from "class-variance-authority";
import { type Component, type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type { Icon } from "../icon/types";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";

// --- internal
import type { buttonVariants } from "./button.config";
type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps {
  label?: string;
  is?: "button" | "router-link" | "a" | string | Component;
  type?: "button" | "submit" | "reset";
  icon?: string | Icon;
  // --- link support
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  // ---
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  spinner?: boolean;
  pill?: boolean;
  // ---
  focusable?: boolean;
  block?: boolean;
  truncate?: boolean;
  variant?: ButtonVariantProps["variant"] | string;
  color?: ButtonVariantProps["color"] | string;
  size?: ButtonVariantProps["size"] | string;
  // ---
  uiConfig?: { button: CxOptions };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
