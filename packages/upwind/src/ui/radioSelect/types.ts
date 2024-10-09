// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { AvatarProps } from "../avatar";
import type { ButtonProps } from "../button";
import type { IconProps } from "../icon";

import type { triggerVariants } from "./radioSelect.config";
import type { VariantProps } from "class-variance-authority";
type TriggerVariantsProp = VariantProps<typeof triggerVariants>;

export interface RadioSelectItem {
  label: string;
  sublabel?: string;
  badge?: string | string[];
  value: string;
  icon?: IconProps["icon"];
  avatar?: Partial<AvatarProps>;
  handler?: Function;
  class?: HTMLAttributes["class"];
}

export interface RadioSelectProps {
  label?: string;
  sublabel?: string;
  badge?: string;
  avatar?: Partial<AvatarProps>;
  icon?: IconProps["icon"];
  // --- state
  items: RadioSelectItem[];
  modelValue?: string | RadioSelectItem;
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  width?: TriggerVariantsProp["width"];
  // ---
  upwindConfig?: { tooltip: Partial<RadioSelectProps> };
  class?: HTMLAttributes["class"];
}
