// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { indicatorVariants } from "./indicator.config";
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
