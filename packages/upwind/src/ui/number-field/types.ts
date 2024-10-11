// --- external
import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type {
  NumberFieldRootProps,
  NumberFieldDecrementProps,
  NumberFieldIncrementProps,
} from "radix-vue";

// --- types
import type { fieldVariants, colorVariants } from "./numberField.config";
type FieldVariantProps = VariantProps<typeof fieldVariants>;
type ColorVariantProps = VariantProps<typeof colorVariants>;

export interface NumberFieldProps
  extends NumberFieldRootProps,
    NumberFieldDecrementProps,
    NumberFieldIncrementProps {
  // --- variants
  variant?: FieldVariantProps["variant"];
  width?: FieldVariantProps["width"];
  color?: ColorVariantProps["color"];
  // --- styles
  upwindConfig?: {};
  class?: HTMLAttributes["class"];
}
