// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { VariantProps } from "class-variance-authority";
import type { itemVariants } from "./radioCards.config";
type RadioCardsItemVariantProps = VariantProps<typeof itemVariants>;

export interface RadioCardsItemProps extends RadioGroupItemProps {
  item: any;
  index: number;
  name?: string;
  label?: string;
  sublabel?: string;
  required: boolean;
  disabled: boolean;
  modelValue: any;
  selected?: boolean;
  // ---
  width?: RadioCardsItemVariantProps["width"];
  uiConfig?: { radioCards: Partial<RadioCardsItemVariantProps> };
}

export interface RadioCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: RadioCardsItemProps[];
  loading?: boolean;
  // ---
  width?: RadioCardsItemVariantProps["width"];
  // ---
  uiConfig?: { radioCards: Partial<RadioCardsProps> };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
}
