// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { buttonVariants } from "./button.config";
type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps {
  label?: string;
  as?: string;
  type?: "button" | "submit" | "reset"; //  type?: HTMLButtonElement["type"];
  // ---
  disabled?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
  spinner?: boolean;
  // ---
  block?: boolean;
  variant?: ButtonVariantProps["variant"];
  color?: ButtonVariantProps["color"];
  size?: ButtonVariantProps["size"];
  // ---
  upmindUIConfig?: { button: Partial<ButtonProps> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
