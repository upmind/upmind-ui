// --- external
// --- types
import type { itemSizeVariants } from "./radioCards.config";
import type {
  ItemContentItemProps,
  ItemContentActionProps
} from "../item-content";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

type _RadioCardsItemSizeVariants = VariantProps<typeof itemSizeVariants>;

export type RadioCardsItemActionProps = ItemContentActionProps;

export interface RadioCardsItemProps
  extends RadioGroupItemProps,
    ItemContentItemProps {
  item?: any;
  index: number;
  name?: string;
  // ---
  required?: boolean;
  disabled?: boolean;
  modelValue: any;
  selected?: boolean;
  value: string;
  // ---
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 items per row. */
  columns?: number;
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
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 items per row. */
  columns?: number;
  // ---
  uiConfig?: { radioCards: CxOptions };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
