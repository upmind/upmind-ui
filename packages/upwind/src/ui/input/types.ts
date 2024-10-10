// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { inputVariants } from "./input.config";
type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  autocomplete?: string;
  autofocus?: boolean;
  disabled?: boolean;
  // list?: string;
  max?: number;
  maxlength?: number;
  min?: number;
  minlength?: number;
  // multiple?: boolean;
  name?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: number;
  // step?: number;
  type?: InputTypeHTMLAttribute;
  width?: number;
  // ---
  upwindConfig?: { input: Partial<InputVariantProps> };
  class?: HTMLAttributes["class"];
}
