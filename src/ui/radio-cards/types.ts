// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { VariantProps } from "class-variance-authority";
import type { rootVariants } from "./radioCards.config";
type RadioCardsVariantProps = VariantProps<typeof rootVariants>;
import type { itemVariants } from "./radioCards.config";
type RadioCardsItemVariantProps = VariantProps<typeof itemVariants>;

export interface RadioCardsItemProps extends RadioGroupItemProps {
  // ---
  label: string;
  values: any[];
  primary?: boolean;
  group?: string;
}

export interface RadioCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  // --- state
  items: RadioCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  width?: RadioCardsItemVariantProps["width"];
  // ---
  upmindUIConfig?: { tooltip: Partial<RadioCardsProps> };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
}
