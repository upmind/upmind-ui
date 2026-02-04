// --- external
import type {
  numberFieldVariants,
  numberFieldRootVariants
} from "./numberField.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  NumberFieldRootProps,
  NumberFieldDecrementProps,
  NumberFieldIncrementProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- types

type NumberFieldRootVariants = VariantProps<typeof numberFieldRootVariants>;
type NumberFieldVariants = VariantProps<typeof numberFieldVariants>;

export interface NumberFieldProps
  extends
    NumberFieldRootProps,
    NumberFieldDecrementProps,
    NumberFieldIncrementProps {
  // --- variants
  size?: NumberFieldRootVariants["size"];
  width?: NumberFieldRootVariants["width"];
  variant?: NumberFieldVariants["variant"];
  // --- behavior
  singleStep?: boolean;
  // --- styles
  uiConfig?: { numberField: CxOptions };
  class?: HTMLAttributes["class"];
  classField?: HTMLAttributes["class"];
}

export enum NUMBER_FIELD_VARIANTS {
  FLAT = "flat",
  MINIMAL = "minimal"
}
