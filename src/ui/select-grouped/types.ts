// --- external
import { type HTMLAttributes } from "vue";

// --- types
import type { CxOptions } from "class-variance-authority";
import type { BadgeProps } from "../badge";
import type { LinkProps } from "../link";

export interface SelectGroupedItemActionProps extends LinkProps {
  handler?: ((event: Event) => void) | string;
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
  modelValue?: string;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Number of groups per row (0-6). 0 = custom grid, 1 = full width. Example: columns={3} displays 3 groups per row. */
  columns?: number;
  class?: HTMLAttributes["class"];
  uiConfig?: { selectGrouped: CxOptions };
}

export interface SelectGroupedBaseGroupProps {
  index?: number;
  focusedGroupIndex?: number;
  modelValue?: string;
  required?: boolean;
  disabled?: boolean;
  columns?: number;
  uiConfig?: { selectGrouped: CxOptions };
}

export interface SelectGroupedGroupRendererProps extends SelectGroupedBaseGroupProps {
  group: SelectGroupedGroupProps;
}

export interface SelectGroupedSingleItemRendererProps extends SelectGroupedBaseGroupProps {
  item: SelectGroupedItemProps;
  group: SelectGroupedGroupProps;
}

export interface SelectGroupedMultiItemRendererProps extends SelectGroupedBaseGroupProps {
  group: SelectGroupedGroupProps;
}

export interface SelectGroupedDropdownItemProps {
  item: SelectGroupedItemProps;
  modelValue?: string;
  focused?: boolean;
}
