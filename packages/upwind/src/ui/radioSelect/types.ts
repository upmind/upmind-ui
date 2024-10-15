// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";
import type { IconProps } from "../icon";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";

import type { triggerVariants } from "./radioSelect.config";
import type { VariantProps } from "class-variance-authority";
type TriggerVariantsProp = VariantProps<typeof triggerVariants>;

export interface RadioSelectItemProps extends RadioGroupItemProps {
  // ---
  label: string;
  text?: string;
  badge?: string | string[];
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  class?: HTMLAttributes["class"];
}

export interface RadioSelectProps extends RadioGroupRootProps {
  label?: string;
  text?: string;
  badge?: string;
  avatar?: Partial<AvatarProps>;
  icon?: IconProps["icon"];
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
