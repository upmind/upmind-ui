// --- external
import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
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
  size?: CheckboxVariantProps["size"] | string;
  width?: CheckboxVariantProps["width"] | string;
  // ---
  uiConfig?: { checkbox: CxOptions };
  class?: HTMLAttributes["class"];
}
