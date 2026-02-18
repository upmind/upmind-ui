import type { CxOptions } from "class-variance-authority";
import type { TooltipRootProps } from "radix-vue";
import type {
  TooltipContentProps,
  TooltipProviderProps,
  TooltipTriggerProps
} from "radix-vue";
import type { HTMLAttributes } from "vue";

export interface TooltipProps
  extends
    TooltipRootProps,
    TooltipContentProps,
    TooltipProviderProps,
    TooltipTriggerProps {
  active?: boolean;
  label?: string;
  to?: string;
  // ---
  uiConfig?: {
    content?: CxOptions;
    arrow?: CxOptions;
    trigger?: CxOptions;
  };
  class?: HTMLAttributes["class"];
}
