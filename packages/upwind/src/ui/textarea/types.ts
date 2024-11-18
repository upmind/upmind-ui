// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { textareaVariants } from "./textarea.config";
type TextareaVariantProps = VariantProps<typeof textareaVariants>;

export interface TextareaProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  id?: string;
  name?: string;
  placeholder?: string;
  // ---
  cols?: number;
  rows?: number;
  // ---
  autocomplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  // ---
  maxlength?: number;
  minlength?: number;
  // --- variants
  size?: TextareaVariantProps["size"];
  // ---
  upwindConfig?: { textarea: Partial<TextareaVariantProps> };
  class?: HTMLAttributes["class"];
}
