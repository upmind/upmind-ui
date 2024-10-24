// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type { CheckboxRootProps } from "radix-vue";
// --- internal
import type { checkboxVariants } from "./checkbox.config";
type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;

export interface CheckboxProps extends CheckboxRootProps {
  // ---
  indeterminate?: boolean;
  autoFocus?: boolean;
  readonly?: boolean;
  // --- variants
  size?: CheckboxVariantProps["size"];
  width?: CheckboxVariantProps["width"];
  // ---
  upwindConfig?: { checkbox: Partial<CheckboxVariantProps> };
  class?: HTMLAttributes["class"];
}
