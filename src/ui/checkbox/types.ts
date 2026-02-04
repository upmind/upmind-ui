// --- external
import type { checkboxVariants } from "./checkbox.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { CheckboxRootProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- internal

type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;

export interface CheckboxProps extends CheckboxRootProps {
  // ---
  indeterminate?: boolean;
  autoFocus?: boolean;
  readonly?: boolean;
  // --- variants
  size?: CheckboxVariantProps["size"];
  // ---
  uiConfig?: { checkbox: CxOptions };
  class?: HTMLAttributes["class"];
}
