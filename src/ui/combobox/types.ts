// --- external
import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  PopoverRootProps,
  PopoverContentProps,
  PopoverTriggerProps
} from "radix-vue";

// --- internal
import type { IconProps } from "../icon";
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";

import type {
  itemVariants,
  contentVariants,
  triggerVariants
} from "./combobox.config";
type ContentVariantsProps = VariantProps<typeof contentVariants>;
type TriggerVariantProps = VariantProps<typeof triggerVariants>;

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
  truncate?: boolean;
  // --- state
  items: ComboboxItemProps[];
  modelValue?: string;
  loading?: boolean;
  disabled?: boolean;
  // --- Search
  search?: boolean | ComboboxSearchFunction;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  checkedIcon?: boolean;
  // --- variants
  size?: TriggerVariantProps["size"];
  width?: TriggerVariantProps["width"];
  dropdownWidth?: ContentVariantsProps["dropdownWidth"];
  ring?: boolean;
  // --- styles
  uiConfig?: { combobox: CxOptions };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
