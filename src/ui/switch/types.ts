// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { switchVariants } from "./switch.config";
type InputVariantProps = VariantProps<typeof switchVariants>;

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
  uiConfig?: { input: Partial<InputVariantProps> };
  class?: HTMLAttributes["class"];
}
