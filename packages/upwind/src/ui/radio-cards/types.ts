// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";

export interface RadioCardsItemProps extends RadioGroupItemProps {
  // ---
  label: string;
}

export interface RadioCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  // --- state
  items: RadioCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  // ---
  upwindConfig?: { tooltip: Partial<RadioCardsProps> };
  class?: HTMLAttributes["class"];
}
