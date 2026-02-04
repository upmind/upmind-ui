// --- external
import type { textareaVariants } from "./textarea.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- internal

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
  // ---
  uiConfig?: { textarea: CxOptions };
  class?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
