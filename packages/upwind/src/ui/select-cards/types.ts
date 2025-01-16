// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type {
  RadioGroupRootProps,
  RadioGroupItemProps,
  PopoverContentProps,
} from "radix-vue";

export interface SelectCardsItemProps extends RadioGroupItemProps {
  // ---
  label: string;
}

export interface SelectCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  collapsible?: boolean;
  radio?: boolean;
  side?: PopoverContentProps["side"];
  // ---
  upwindConfig?: { tooltip: Partial<SelectCardsProps> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
