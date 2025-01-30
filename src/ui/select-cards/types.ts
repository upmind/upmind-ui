// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { ButtonProps } from "../button";
import type {
  RadioGroupRootProps,
  RadioGroupItemProps,
  PopoverContentProps,
} from "radix-vue";

export interface SelectCardsItemProps extends RadioGroupItemProps {
  // ---
  label: string;
}

export interface SelectCardsProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  name?: string;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  disabled: boolean;
  // ---
  color?: ButtonProps["color"];
  side?: PopoverContentProps["side"];
  size?: ButtonProps["size"];
  radio?: boolean;
  focusable?: boolean;

  uiConfig?: { select: Partial<SelectCardsProps> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}
export interface SelectCardsTriggerProps
  extends Omit<ButtonProps, "variant" | "uiConfig"> {
  name?: string;
  overrideIndex?: number;
  selected?: { label: string };
  loading?: boolean;
  placeholder?: string;
  label?: string;
  size?: ButtonProps["size"];
  open?: boolean;
  useInputGroup?: boolean;
  class?: string;
  focusable?: boolean;
}
