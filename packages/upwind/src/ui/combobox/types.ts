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

import type { itemVariants } from "./combobox.config";
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
  // --- state
  items: ComboboxItemProps[];
  modelValue?: string | ComboboxItemProps;
  loading?: boolean;
  // --- Search
  searchable?: boolean;
  searchMessage?: string;
  emptyMessage?: string;
  filterFunction?: (val: any, term: any) => any;
  // --- variants
  color?: ItemVariantProps["color"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  width?: ItemVariantProps["width"];
  iconSize?: IconProps["size"];
  // --- styles
  upwindConfig?: { combobox: Partial<ComboboxProps> };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
}
