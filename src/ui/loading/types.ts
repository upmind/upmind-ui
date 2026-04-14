import type { spinnerVariants } from "../spinner/spinner.config";
import type { VariantProps, CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export type LoadingProps = {
  is?: string;
  active?: boolean;
  transparent?: boolean;
  size?: SpinnerVariantProps["size"] | string;
  class?: HTMLAttributes["class"];
  classActive?: HTMLAttributes["class"];
  uiConfig?: {
    loading?: {
      root?: CxOptions;
      content?: CxOptions;
      spinner?: CxOptions;
    };
  };
};
