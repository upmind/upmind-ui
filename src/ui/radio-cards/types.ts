// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { itemVariants } from "./radioCards.config";
import type { BadgeProps } from "../badge";
type RadioCardsItemVariantProps = VariantProps<typeof itemVariants>;

export interface RadioCardsItemProps extends RadioGroupItemProps {
  item: any;
  index: number;
  name?: string;
  // ---
  label?: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps;
  secondaryBadge?: BadgeProps;
  action?: string;
  // ---
  required?: boolean;
  disabled?: boolean;
  modelValue: any;
  selected?: boolean;
  value: string;
  // ---
  width?: RadioCardsItemVariantProps["width"] | string;
  list?: boolean;
  uiConfig?: { radioCards: CxOptions };
  dataHover?: boolean;
  dataFocus?: boolean;
}

export interface RadioCardsProps extends RadioGroupRootProps {
  label?: string;
  // placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: RadioCardsItemProps[];
  loading?: boolean;
  // ---
  width?: RadioCardsItemVariantProps["width"] | string;
  list?: boolean;
  // ---
  uiConfig?: { radioCards: CxOptions };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
