// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  NumberFieldRootProps,
  NumberFieldDecrementProps,
  NumberFieldIncrementProps,
} from "radix-vue";

// --- types
import type { numberFieldVariants } from "./numberField.config";
type NumberFieldVariants = VariantProps<typeof numberFieldVariants>;

export interface NumberFieldProps
  extends NumberFieldRootProps,
    NumberFieldDecrementProps,
    NumberFieldIncrementProps {
  // --- variants
  size?: NumberFieldVariants["size"];

  // --- styles
  upwindConfig?: {};
  class?: HTMLAttributes["class"];
}
