// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type {
  TooltipContentProps,
  TooltipProviderProps,
  TooltipTriggerProps
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
  active?: boolean;
  label?: string;
  to?: string;
  // ---
  color?: TooltipVariantProps["color"];
  // ---
  uiConfig?: {
    content?: CxOptions;
    arrow?: CxOptions;
    trigger?: CxOptions;
  };
  class?: HTMLAttributes["class"];
}
