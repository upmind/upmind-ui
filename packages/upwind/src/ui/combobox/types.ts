// --- external
import { type HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { buttonVariants, itemVariants } from "./combobox.config";
type ButtonVariantProps = VariantProps<typeof buttonVariants>;
type ItemVariantProps = VariantProps<typeof itemVariants>;

export interface ComboboxItem {
  label: string;
  value: string;
  icon?: IconProps["icon"];
}

export interface ComboboxProps {
  modelValue?: string;
  items: ComboboxItem[];
  label?: string;
  loading?: boolean;
  searchMessage?: string;
  emptyMessage?: string;
  // --- variants
  width?: ButtonVariantProps["width"];
  color?: ItemVariantProps["color"];
  // --- styles
  upwindConfig?: { alert: Partial<ComboboxProps> };
  class?: HTMLAttributes["class"];
}
