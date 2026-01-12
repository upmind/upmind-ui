// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { itemVariants } from "./radioCards.config";
type RadioCardsItemVariantProps = VariantProps<typeof itemVariants>;

export interface RadioCardsCollapsibleItemProps extends RadioGroupItemProps {
  item?: any;
  index: number;
  name?: string;
  label?: string;
  minimal?: boolean;
  sublabel?: string;
  required?: boolean;
  disabled?: boolean;
  modelValue: any;
  selected?: boolean;
  value: string;
  // ---
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 items per row. */
  columns?: number;
  list?: boolean;
  uiConfig?: { radioCards: CxOptions };
}

export interface RadioCardsCollapsibleProps extends RadioGroupRootProps {
  label?: string;
  placeholder?: string;
  noneText?: string;
  required?: boolean;
  overrideIndex?: number;
  useInputGroup?: boolean;
  open?: boolean;
  autoCollapse?: boolean;
  minimal?: boolean;
  changeButtonLabel?: string;
  // --- state
  items: RadioCardsCollapsibleItemProps[];
  loading?: boolean;
  // ---
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 items per row. */
  columns?: number;
  list?: boolean;
  // ---
  uiConfig?: { radioCards: CxOptions };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
}
