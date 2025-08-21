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
import type { rootVariants } from "./button.config";
type ButtonVariantProps = VariantProps<typeof rootVariants>;

export interface ButtonProps {
  label?: string;
  is?: "button" | "router-link" | "a" | string | Component;
  type?: "button" | "submit" | "reset";
  icon?: string | Icon;
  avatar?: string | Icon;
  iconAppend?: string | Icon;
  avatarAppend?: string | Icon;
  // --- link support
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  // ---
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  spinner?: boolean;
  pill?: boolean;
  ring?: boolean;
  // ---
  focusable?: boolean;
  block?: boolean;
  align?: ButtonVariantProps["align"] | string;
  truncate?: boolean;
  checked?: boolean;
  variant?: ButtonVariantProps["variant"] | string;
  color?: ButtonVariantProps["color"] | string;
  size?: ButtonVariantProps["size"] | string;
  // ---
  uiConfig?: { button: CxOptions };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}

export interface ButtonItemsProps {
  variant?: ButtonProps["variant"];
  icon?: ButtonProps["icon"];
  avatar?: ButtonProps["avatar"];
  size?: ButtonProps["size"];
  checked?: boolean;
}
