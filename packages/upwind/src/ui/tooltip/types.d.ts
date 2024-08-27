// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { tooltipConfig } from "./tooltip.config";
export type TooltipConfig = VariantProps<typeof tooltipConfig>;

export interface TooltipProps {
  direction?: "top" | "right" | "bottom" | "left";
}
