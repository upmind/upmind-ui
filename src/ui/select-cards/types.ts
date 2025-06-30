// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type {
  RadioGroupRootProps,
  RadioGroupItemProps,
  PopoverContentProps
} from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { triggerVariants } from "./selectCards.config";
type TriggerVariantProps = VariantProps<typeof triggerVariants>;

export interface SelectCardsItemProps extends RadioGroupItemProps {
  label: string;
}

export interface SelectCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  disabled: boolean;
  // ---
  color?: ButtonProps["color"];
  side?: PopoverContentProps["side"];
  width?: TriggerVariantProps["width"];
  focusable?: boolean;

  uiConfig?: { select: CxOptions };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
export interface SelectCardsTriggerProps
  extends Omit<ButtonProps, "variant" | "uiConfig"> {
  selected?: { label: string };
  loading?: boolean;
  placeholder?: string;
  label?: string;
  size?: ButtonProps["size"];
  open?: boolean;
  class?: string;
  focusable?: boolean;
}
