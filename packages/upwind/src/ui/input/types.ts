// --- external
import type { InputTypeHTMLAttribute, InputHTMLAttributes } from "vue";
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { inputVariants } from "./input.config";
type InputVariantProps = VariantProps<typeof inputVariants>;

type Booleanish = boolean | "true" | "false";
type Numberish = number | string;

export interface InputProps {
  modelValue?: string | number;
  defaultValue?: string | number;
  // ---
  autocomplete?: string;
  autofocus?: Booleanish;
  disabled?: Booleanish;
  // list?: string;
  max?: Numberish;
  maxlength?: Numberish;
  min?: Numberish;
  minlength?: Numberish;
  // multiple?: Booleanish;
  name?: string;
  placeholder?: string;
  readonly?: Booleanish;
  required?: Booleanish;
  size?: Numberish;
  // step?: Numberish;
  type?: InputTypeHTMLAttribute;
  width?: Numberish;
  // ---
  upwindConfig?: { input: Partial<InputVariantProps> };
  class?: InputHTMLAttributes["class"];
}
