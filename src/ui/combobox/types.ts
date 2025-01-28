// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  PopoverRootProps,
  PopoverContentProps,
  PopoverTriggerProps,
} from "radix-vue";

// --- internal
import type { IconProps } from "../icon";
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";

import type { itemVariants, contentVariants } from "./combobox.config";
type ContentVariantsProps = VariantProps<typeof contentVariants>;
type ItemVariantProps = VariantProps<typeof itemVariants>;

export interface ComboboxItemProps {
  label: string;
  selectedLabel: string;
  sublabel?: string;
  tag?: string | string[];
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: Function;
  class?: HTMLAttributes["class"];
  persist?: boolean;
}

export interface ComboboxSearchFunction {
  (value: string, items?: ComboboxItemProps[]): ComboboxItemProps[];
}

export interface ComboboxProps
  extends PopoverRootProps,
    PopoverContentProps,
    PopoverTriggerProps {
  label?: string;
  sublabel?: string;
  tag?: string;
  avatar?: Partial<AvatarProps>;
  icon?: IconProps["icon"];
  itemLabel?: string;
  itemValue?: string;
  // --- state
  items: ComboboxItemProps[];
  modelValue?: string | ComboboxItemProps;
  loading?: boolean;
  disabled?: boolean;
  // --- Search
  search?: boolean | ComboboxSearchFunction;
  placeholder?: string;
  emptyMessage?: string;
  // --- variants
  size?: ButtonProps["size"];
  color?: ItemVariantProps["color"];
  variant?: ButtonProps["variant"];
  width?: ContentVariantsProps["width"];
  iconSize?: IconProps["size"];
  // --- styles
  uiConfig?: { combobox: Partial<ComboboxProps> };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
}
