// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  TooltipContentProps,
  TooltipProviderProps,
  TooltipTriggerProps,
} from "radix-vue";
import { type TooltipRootProps } from "radix-vue";

// --- internal
import type { tooltipVariants } from "./tooltip.config";
type TooltipVariantProps = VariantProps<typeof tooltipVariants>;

export interface TooltipProps
  extends TooltipRootProps,
    TooltipContentProps,
    TooltipProviderProps,
    TooltipTriggerProps {
  label?: string;
  // ---
  color?: TooltipVariantProps["color"] | string;
  // ---
  uiConfig?: { tooltip: CxOptions };
  class?: HTMLAttributes["class"];
}
