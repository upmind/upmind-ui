// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { VariantProps } from "class-variance-authority";
import type { rootVariants } from "./radioCards.config";
type RadioCardsVariantProps = VariantProps<typeof rootVariants>;

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
  layout?: RadioCardsVariantProps["layout"];
  ring?: boolean;
  // ---
  upwindConfig?: { tooltip: Partial<RadioCardsProps> };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
}
