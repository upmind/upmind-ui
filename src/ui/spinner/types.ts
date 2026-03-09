// --- external
import type { spinnerVariants } from "./spinner.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { PrimitiveProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
// --- internal

export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export type SpinnerProps = PrimitiveProps & {
  // ---
  size?: SpinnerVariantProps["size"] | string;
  // ---
  uiConfig?: { spinner: CxOptions };
  class?: HTMLAttributes["class"];
};
