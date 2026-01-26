import type { VariantProps } from "class-variance-authority";
import type { spinnerVariants } from "../spinner/spinner.config";
import type { HTMLAttributes } from "vue";
export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface LoadingProps {
  is?: string;
  active?: boolean;
  transparent?: boolean;
  size?: SpinnerVariantProps["size"] | string;
  class?: HTMLAttributes["class"];
  classActive?: HTMLAttributes["class"];
}
