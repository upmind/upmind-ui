// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  NumberFieldRootProps,
  NumberFieldDecrementProps,
  NumberFieldIncrementProps,
} from "radix-vue";

// --- types
import type {
  numberFieldVariants,
  numberFieldRootVariants,
} from "./numberField.config";
type NumberFieldRootVariants = VariantProps<typeof numberFieldRootVariants>;
type NumberFieldVariants = VariantProps<typeof numberFieldVariants>;

export interface NumberFieldProps
  extends NumberFieldRootProps,
    NumberFieldDecrementProps,
    NumberFieldIncrementProps {
  // --- variants
  text?: NumberFieldRootVariants["text"];
  width?: NumberFieldRootVariants["width"];
  variant?: NumberFieldVariants["variant"];
  height?: NumberFieldVariants["height"];
  // --- styles
  upmindUIConfig?: {};
  class?: HTMLAttributes["class"];
  classField?: HTMLAttributes["class"];
}
