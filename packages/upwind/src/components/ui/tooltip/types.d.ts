// --- external
import { type VariantProps } from "class-variance-authority";

// --- types
import type { tooltipConfig } from "./tooltip.cva";
export type TooltipConfig = VariantProps<typeof tooltipConfig>;

export interface TooltipProps {
  direction?: "top" | "right" | "bottom" | "left";
}
