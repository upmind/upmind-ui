import type { HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";
import type { spinnerVariants } from "../spinner/spinner.config";
export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface LoadingProps {
  active?: boolean;
  size?: SpinnerVariantProps["size"];
  class?: HTMLAttributes["class"];
}
