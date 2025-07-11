// --- external
import type { CxOptions } from "class-variance-authority";
import { type Component, type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { buttonVariants } from "./button.config";
type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps {
  label?: string;
  as?: string | Component;
  type?: "button" | "submit" | "reset"; //  type?: HTMLButtonElement["type"];
  // ---
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  spinner?: boolean;
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
