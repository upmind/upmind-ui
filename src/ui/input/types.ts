// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { containerVariants } from "./input.config";
export type ContainerVariantProps = VariantProps<typeof containerVariants>;

// --- types
import type { Icon } from "../icon/types";
import type { AvatarProps } from "../avatar/types";

export type InputProps = {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  placeholder?: string;
  // ---
  icon?: string | Icon;
  avatar?: Partial<AvatarProps>;
  iconAppend?: string | Icon;
  avatarAppend?: Partial<AvatarProps>;
  ring?: boolean;
  // ---
  autocomplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  mask?: string | RegExp;
  // ---
  maxlength?: number;
  minlength?: number;
  // ---
  max?: number | string;
  min?: number | string;
  step?: number;
  // --- variants
  width?: ContainerVariantProps["width"] | string | undefined;
  // ---
  uiConfig?: { input?: CxOptions };
  class?: HTMLAttributes["class"];
};

export interface InputItemsProps {
  icon?: InputProps["icon"];
  avatar?: InputProps["avatar"];
}
