// --- external
import type { switchVariants } from "./switch.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
// --- internal
type _InputVariantProps = VariantProps<typeof switchVariants>;

export interface SwitchProps {
  modelValue?: boolean | number;
  defaultValue?: boolean | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  // ---
  autocomplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  // ---
  uiConfig?: { input: CxOptions };
  class?: HTMLAttributes["class"];
}
