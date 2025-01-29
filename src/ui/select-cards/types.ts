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
  name?: string;
  overrideIndex?: number;
  useInputGroup?: boolean;
  // --- state
  items: SelectCardsItemProps[];
  loading?: boolean;
  // ---
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
  radio?: boolean;
  focusable?: boolean;

  uiConfig?: { select: Partial<SelectCardsPropsBase> };
  class?: HTMLAttributes["class"];
  contentClass?: HTMLAttributes["class"];
}

interface CollapsibleSelectCardsProps
  extends Omit<SelectCardsPropsBase, "uiConfig"> {
  variant: "collapsible";
  side?: never;
  uiConfig?: { select: Partial<CollapsibleSelectCardsProps> };
}

interface DropdownSelectCardsProps
  extends Omit<SelectCardsPropsBase, "uiConfig"> {
  variant: "dropdown";
  side?: PopoverContentProps["side"];
  uiConfig?: { tooltip: Partial<DropdownSelectCardsProps> };
}

export type SelectCardsProps =
  | CollapsibleSelectCardsProps
  | DropdownSelectCardsProps;

export interface SelectCardsTriggerProps
  extends Omit<ButtonProps, "variant" | "uiConfig"> {
  name: string;
  overrideIndex: number;
  selected?: { label: string };
  loading: boolean;
  placeholder?: string;
  label?: string;
  size: ButtonProps["size"];
  open: boolean;
  useInputGroup: boolean;
  class: string;
  variant: string;
  focusable?: boolean;
  // uiConfig?: { select: Partial<SelectCardsTriggerProps> };
}
