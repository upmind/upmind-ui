// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { anchorVariants } from "./autocomplete.config";
import type { AvatarProps } from "../avatar";
import type { IconProps } from "../icon";
type AnchorVariantProps = VariantProps<typeof anchorVariants>;

export interface AutocompleteItemProps {
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

export interface AutocompleteProps {
  // --- state
  items: AutocompleteItemProps[];
  modelValue?: string;
  defaultValue?: string;
  placeholder?: string;
  emptyMessage?: string;
  // --- variants
  size?: AnchorVariantProps["size"];
  width?: AnchorVariantProps["width"];
  iconSize?: IconProps["size"];
  // --- styles
  upwindConfig?: { autocomplete: Partial<AutocompleteProps> };
  class?: HTMLAttributes["class"];
}
