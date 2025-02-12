// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { inputVariants } from "./input.config";
export type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps {
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
  size?: InputVariantProps["size"] | string;
  width?: InputVariantProps["width"] | string;
  // ---
  uiConfig?: { input?: CxOptions };
  class?: HTMLAttributes["class"];
}
