// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { RadioGroupRootProps, RadioGroupItemProps } from "radix-vue";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { itemSizeVariants } from "./radioCards.config";
import type { BadgeProps } from "../badge";
import type { LinkProps } from "../link";

type RadioCardsItemSizeVariants = VariantProps<typeof itemSizeVariants>;

export type RadioCardsItemActionProps = LinkProps & {
  handler?: Function | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
};

export interface RadioCardsItemProps extends RadioGroupItemProps {
  item?: any;
  index: number;
  name?: string;
  // ---
  label?: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps;
  secondaryBadge?: BadgeProps;
  action?: RadioCardsItemActionProps;

  // ---
  required?: boolean;
  disabled?: boolean;
  modelValue: any;
  selected?: boolean;
  value: string;
  // ---
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: width={3} displays 3 items per row. */
  width?: number;
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
  /** Number of items per row (0-6). 0 = custom grid, 1 = full width. Example: width={3} displays 3 items per row. */
  width?: number;
  // ---
  uiConfig?: { radioCards: CxOptions };
  class?: HTMLAttributes["class"];
  radioClass?: HTMLAttributes["class"];
  dataHover?: boolean;
  dataFocus?: boolean;
}
