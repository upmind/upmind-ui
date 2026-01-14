// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { groupSizeVariants } from "./selectGrouped.config";
import type { BadgeProps } from "../badge";
import type { LinkProps } from "../link";

type SelectGroupedGroupSizeVariants = VariantProps<typeof groupSizeVariants>;

export interface SelectGroupedItemActionProps extends LinkProps {
  handler?: Function | string;
  type?: HTMLButtonElement["type"];
  visible?: boolean;
}

export interface SelectGroupedItemProps {
  value: string;
  label?: string;
  secondaryLabel?: string;
  description?: string;
  secondaryDescription?: string;
  badge?: BadgeProps;
  secondaryBadge?: BadgeProps;
  action?: SelectGroupedItemActionProps;
  icon?: string;
  disabled?: boolean;
}

export interface SelectGroupedGroupProps {
  name?: string;
  icon?: string;
  description?: string;
  items: SelectGroupedItemProps[];
}

export interface SelectGroupedProps {
  groups: SelectGroupedGroupProps[];
  modelValue?: string | string[];
  defaultValue?: string | string[];
  name?: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  // ---
  /** Number of groups per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 groups per row. */
  columns?: number;
  noneText?: string;
  // --- styles
  class?: HTMLAttributes["class"];
  uiConfig?: { selectGrouped: CxOptions };
  // --- a11y
  ariaLabel?: string;
  ariaLabelledby?: string;
  // --- state
  dataHover?: boolean;
  dataFocus?: boolean;
}
