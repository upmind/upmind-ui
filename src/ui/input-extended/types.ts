// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
// --- internal
import type { inputContainerVariants } from "./inputExtended.config";
export type InputContainerVariantProps = VariantProps<
  typeof inputContainerVariants
>;

export type InputExtendedProps = {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  placeholder?: string;
  // ---
  // icon?: string | Icon;
  // avatar?: Partial<AvatarProps>;
  // iconAppend?: string | Icon;
  // avatarAppend?: Partial<AvatarProps>;
  // ring?: boolean;
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
  inputSize?: InputContainerVariantProps["inputSize"];
  width?: InputContainerVariantProps["width"];
  // ---
  uiConfig?: { input?: CxOptions };
  class?: HTMLAttributes["class"];
};

// ---
