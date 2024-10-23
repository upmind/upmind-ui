// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";

export interface RadioSelectItemProps extends RadioGroupItemProps {
  // ---
  label: string;
}

export interface RadioSelectProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  // --- state
  items: RadioSelectItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  // ---
  upwindConfig?: { tooltip: Partial<RadioSelectProps> };
  class?: HTMLAttributes["class"];
}
