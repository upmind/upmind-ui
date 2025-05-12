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
import type { contentVariants } from "./tooltip.config";
type TooltipVariantProps = VariantProps<typeof contentVariants>;

export interface TooltipProps
  extends TooltipRootProps,
    TooltipContentProps,
    TooltipProviderProps,
    TooltipTriggerProps {
  label?: string;
  // ---
  color?: TooltipVariantProps["color"] | string;
  // ---
  uiConfig?: {
    tooltip: {
      content: string;
      arrow: string;
      trigger: string;
    };
  };
  class?: HTMLAttributes["class"];
}
