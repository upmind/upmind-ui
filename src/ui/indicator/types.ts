import type { IconProps } from "../icon";
import type { indicatorVariants } from "./indicator.config";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

type IndicatorVariantProps = VariantProps<typeof indicatorVariants>;

export interface IndicatorProps {
  modelValue: { type: string };
  icon?: IconProps["icon"];
  // ---
  size?: IndicatorVariantProps["size"] | string;
  color?: IndicatorVariantProps["color"] | string;
  shape?: IndicatorVariantProps["shape"] | string;

  // ---
  uiConfig?: { indicator: CxOptions };
  class?: HTMLAttributes["class"];
}
