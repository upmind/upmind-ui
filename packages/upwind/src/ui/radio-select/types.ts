// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";

import type { triggerVariants } from "./radioSelect.config";
import type { VariantProps } from "class-variance-authority";
type TriggerVariantsProp = VariantProps<typeof triggerVariants>;

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
  width?: TriggerVariantsProp["width"];
  // ---
  upwindConfig?: { tooltip: Partial<RadioSelectProps> };
  class?: HTMLAttributes["class"];
}
