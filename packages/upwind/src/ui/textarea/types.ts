// --- external
import type { HTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { textareaVariants } from "./textarea.config";
type TextareaVariantProps = VariantProps<typeof textareaVariants>;

export interface TextareaProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  autocomplete?: string;
  autofocus?: boolean;
  cols?: number;
  disabled?: boolean;
  maxlength?: number;
  minlength?: number;
  name?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  rows?: number;
  size?: number;
  // step?: number;
  width?: number;
  // ---
  upwindConfig?: { textarea: Partial<TextareaVariantProps> };
  class?: HTMLAttributes["class"];
}
