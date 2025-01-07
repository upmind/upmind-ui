// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";

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
  collapsible?: boolean;
  radio?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  // ---
  upwindConfig?: { tooltip: Partial<SelectCardsProps> };
  class?: HTMLAttributes["class"];
}
