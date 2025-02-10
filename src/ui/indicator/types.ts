// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { indicatorVariants } from "./indicator.config";
type IndicatorVariantProps = VariantProps<typeof indicatorVariants>;

export interface IndicatorProps {
  modelValue: { type: string };
  icon?: IconProps["icon"];
  // ---
  size?: IndicatorVariantProps["size"];
  color?: IndicatorVariantProps["color"];
  shape?: IndicatorVariantProps["shape"];

  // ---
  uiConfig?: { indicator: Partial<IndicatorProps> };
  class?: HTMLAttributes["class"];
}
