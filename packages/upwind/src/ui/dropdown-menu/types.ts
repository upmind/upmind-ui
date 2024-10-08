// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { buttonVariants, itemVariants } from "./dropdown-menu.config";
type ButtonVariantProps = VariantProps<typeof buttonVariants>;
type ItemVariantProps = VariantProps<typeof itemVariants>;

export interface DropdownMenuItem {
  label: string;
  value: string;
  icon?: IconProps["icon"];
}

export interface DropdownMenuProps {
  modelValue?: string | DropdownMenuItem;
  items: DropdownMenuItem[];
  label?: string;
  loading?: boolean;
  searchMessage?: string;
  emptyMessage?: string;
  hideLabel?: boolean;
  // --- variants
  width?: ButtonVariantProps["width"];
  color?: ItemVariantProps["color"];
  // --- styles
  upwindConfig?: { "dropdown-menu": Partial<DropdownMenuProps> };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
}
