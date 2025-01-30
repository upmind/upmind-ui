// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import { type PrimitiveProps } from "radix-vue";

// --- internal
import type { spinnerVariants } from "./spinner.config";
export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface SpinnerProps extends PrimitiveProps {
  // ---
  size?: SpinnerVariantProps["size"];
  // ---
  uiConfig?: { spinner: Partial<SpinnerProps> };
  class?: HTMLAttributes["class"];
}
