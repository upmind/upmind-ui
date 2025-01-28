// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { indicatorVariants } from "./indicator.config";
type IndicatorVariantProps = VariantProps<typeof indicatorVariants>;

export interface IndicatorProps {
  modelValue: { type: String };
  icon?: IconProps["icon"];
  // ---
  size?: IndicatorVariantProps["size"];
  color?: IndicatorVariantProps["color"];
  shape?: IndicatorVariantProps["shape"];

  // ---
  upmindUIConfig?: { indicator: Partial<IndicatorProps> };
  class?: HTMLAttributes["class"];
}
