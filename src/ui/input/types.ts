// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { Icon } from "../icon/types";

// --- internal
import type { containerVariants, inputVariants } from "./input.config";
export type ContainerVariantProps = VariantProps<typeof containerVariants>;
export type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  placeholder?: string;
  icon?: string | Icon;
  avatar?: string | Icon;
  iconAppend?: string | Icon;
  avatarAppend?: string | Icon;
  // ---
  autocomplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  // ---
  maxlength?: number;
  minlength?: number;
  // ---
  max?: number | string;
  min?: number | string;
  step?: number;
  // --- variants
  size?: InputVariantProps["size"] | string;
  width?: ContainerVariantProps["width"] | string;
  // ---
  uiConfig?: { input?: CxOptions };
  class?: HTMLAttributes["class"];
}

export interface InputItemsProps {
  icon?: InputProps["icon"];
  avatar?: InputProps["avatar"];
}
