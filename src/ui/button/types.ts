import type { rootVariants } from "./button.config";
import type { AvatarProps } from "../avatar";
import type { Icon } from "../icon/types";
import type { CxOptions } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { Component, HTMLAttributes } from "vue";
import type {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router";

type ButtonVariantProps = VariantProps<typeof rootVariants>;

export interface ButtonProps {
  label?: string;
  is?: "button" | "router-link" | "a" | string | Component;
  type?: HTMLButtonElement["type"];
  icon?: string | Icon;
  avatar?: Partial<AvatarProps>;
  iconAppend?: string | Icon;
  avatarAppend?: Partial<AvatarProps>;
  // --- link support
  to?: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric;
  href?: string;
  // ---
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  ring?: boolean;
  // ---
  focusable?: boolean;
  block?: boolean;
  align?: ButtonVariantProps["align"];
  truncate?: boolean;
  checked?: boolean;
  variant?: ButtonVariantProps["variant"];
  color?: ButtonVariantProps["color"];
  size?: ButtonVariantProps["size"];
  // ---
  uiConfig?: {
    button: { root: CxOptions; label: CxOptions; items: CxOptions };
  };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}

export interface ButtonItemsProps {
  variant?: ButtonProps["variant"];
  icon?: ButtonProps["icon"];
  avatar?: ButtonProps["avatar"];
  size?: ButtonProps["size"];
  checked?: boolean;
  loading?: boolean;
}
