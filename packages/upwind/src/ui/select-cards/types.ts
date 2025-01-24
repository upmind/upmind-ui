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
  variant?: "collapsible" | "dropdown";
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
  radio?: boolean;
  side?: PopoverContentProps["side"];
  // ---
  upwindConfig?: { tooltip: Partial<SelectCardsProps> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
