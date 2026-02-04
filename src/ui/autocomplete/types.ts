// --- external
import type { AvatarProps } from "../avatar";
import type { IconProps } from "../icon";
import type { anchorVariants, contentVariants } from "./autocomplete.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  ComboboxRootProps,
  ComboboxInputProps,
  ComboboxItemProps
} from "radix-vue";
// --- internal
import type { HTMLAttributes } from "vue";

type AnchorVariantProps = VariantProps<typeof anchorVariants>;
type ContentVariantProps = VariantProps<typeof contentVariants>;

export interface AutocompleteItemProps extends ComboboxItemProps {
  label: string;
  tag?: string | string[];
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: Function;
  class?: HTMLAttributes["class"];
  persist?: boolean;
}

export interface AutocompleteSearchFunction {
  (
    value: string,
    items?: AutocompleteItemProps[]
  ): Promise<AutocompleteItemProps[]>;
}

export interface AutocompleteProps
  extends ComboboxRootProps, ComboboxInputProps {
  // --- state
  itemLabel?: string;
  itemValue?: string;
  // --- state
  items: AutocompleteItemProps[];
  modelValue?: string | AutocompleteItemProps;
  defaultValue?: AutocompleteItemProps | AutocompleteItemProps[];

  // --- Search
  search?: AutocompleteSearchFunction;
  placeholder?: string;
  emptyMessage?: string;
  // --- variants
  size?: AnchorVariantProps["size"] | string;
  // color?: ItemVariantProps["color"];
  // variant?: ButtonProps["variant"];
  width?: AnchorVariantProps["width"] | string;
  popoverWidth?: ContentVariantProps["popoverWidth"] | string;
  iconSize?: AvatarProps["size"];
  // --- styles
  uiConfig?: { autocomplete: CxOptions };
  class?: HTMLAttributes["class"];
  popoverClass?: HTMLAttributes["class"];
}
