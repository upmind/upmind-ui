// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type { NumberFieldRootProps } from "radix-vue";
// --- internal
import type { numberFieldVariants } from "./number-field.config";
type NumberFieldVariantProps = VariantProps<typeof numberFieldVariants>;

export interface NumberFieldProps extends NumberFieldRootProps {
  // ---
  autofocus?: boolean;
  readonly?: boolean;
  // --- variants
  size?: NumberFieldVariantProps["size"];
  // ---
  upwindConfig?: { numberField: Partial<NumberFieldVariantProps> };
  class?: HTMLAttributes["class"];
}
