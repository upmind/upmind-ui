// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type {
  inputExtendedVariants,
  inputContainerVariants,
} from "./inputExtended.config";
export type InputExtendedVariantProps = VariantProps<
  typeof inputExtendedVariants
>;

export type InputContainerVariantProps = VariantProps<
  typeof inputContainerVariants
>;

export interface InputExtendedProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  placeholder?: string;
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
  height?: InputExtendedVariantProps["height"] | string;
  text?: InputExtendedVariantProps["text"] | string;
  width?: InputContainerVariantProps["width"] | string;
  // ---
  uiConfig?: { input?: CxOptions };
  class?: HTMLAttributes["class"];
}
