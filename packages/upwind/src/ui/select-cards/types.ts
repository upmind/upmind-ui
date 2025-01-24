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

interface SelectCardsPropsBase extends RadioGroupRootProps {
  variant?: "collapsible" | "dropdown";
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
  radio?: boolean;
  upwindConfig?: { tooltip: Partial<SelectCardsPropsBase> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}

interface CollapsibleSelectCardsProps
  extends Omit<SelectCardsPropsBase, "upwindConfig"> {
  variant: "collapsible";
  side?: never;
  upwindConfig?: { tooltip: Partial<CollapsibleSelectCardsProps> };
}

interface DropdownSelectCardsProps
  extends Omit<SelectCardsPropsBase, "upwindConfig"> {
  variant: "dropdown";
  side?: PopoverContentProps["side"];
  upwindConfig?: { tooltip: Partial<DropdownSelectCardsProps> };
}

export type SelectCardsProps =
  | CollapsibleSelectCardsProps
  | DropdownSelectCardsProps;
