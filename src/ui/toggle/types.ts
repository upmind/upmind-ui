// --- external
import type { InputTypeHTMLAttribute, HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { toggleVariants } from "./toggle.config.ts";
type ToggleVariantProps = VariantProps<typeof toggleVariants>;

export type { ToggleVariantProps };

export interface ToggleProps {
  modelValue?: boolean | number;
  defaultValue?: boolean | number;
  // ---
  id?: string;
  name?: string;
  type?: InputTypeHTMLAttribute;
  // ---
  variant?: ToggleVariantProps["variant"];
  size?: ToggleVariantProps["size"];
  // ---
  autocomplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  // ---
  upmindUIConfig?: { input: Partial<ToggleVariantProps> };
  class?: HTMLAttributes["class"];
}
