// --- external
// --- types
import type { BadgeProps } from "../badge";
import type { LinkProps } from "../link";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes, Ref, ComputedRef } from "vue";

export type ToggleSelectionOptions = {
  currentValue: string | undefined;
  itemValue: string;
  required?: boolean;
  disabled?: boolean;
};

export type UseListNavigationOptions = {
  wrap?: boolean;
  orientation?: "vertical" | "horizontal" | "both";
  initialIndex?: number;
};

export type UseListNavigationReturn = {
  focusedIndex: Ref<number>;
  hasFocus: ComputedRef<boolean>;
  focusItem: (index: number) => void;
  focusNext: () => boolean;
  focusPrev: () => boolean;
  focusFirst: () => void;
  focusLast: () => void;
  resetFocus: () => void;
  getKeyboardHandlers: (options?: KeyboardHandlerOptions) => KeyboardHandlers;
};

export type KeyboardHandlerOptions = {
  onNavigate?: (index: number, direction: "next" | "prev") => void;
  onNavigateEdge?: (index: number, edge: "first" | "last") => void;
  preventDefault?: boolean;
};

export type KeyboardHandlers = {
  onKeydown: (event: KeyboardEvent) => void;
};

export type SelectGroupedItemActionProps = LinkProps & {
  handler?: Function;
  visible?: boolean;
};

export type SelectGroupedItemProps = {
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
};

export type SelectGroupedGroupProps = {
  name?: string;
  icon?: string;
  description?: string;
  items: SelectGroupedItemProps[];
  dropdown?: boolean;
};

export type SelectGroupedProps = {
  groups: SelectGroupedGroupProps[];
  modelValue?: string;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  as?: "ul" | "ol";
  class?: HTMLAttributes["class"];
  uiConfig?: { selectGrouped: CxOptions };
};

export type SelectGroupedBaseGroupProps = {
  index?: number;
  focusedGroupIndex?: number;
  modelValue?: string;
  required?: boolean;
  disabled?: boolean;
  uiConfig?: { selectGrouped: CxOptions };
};

export type SelectGroupedOptionRendererProps = SelectGroupedBaseGroupProps & {
  group: SelectGroupedGroupProps;
};

export type SelectGroupedSingleItemRendererProps =
  SelectGroupedBaseGroupProps & {
    item: SelectGroupedItemProps;
    group: SelectGroupedGroupProps;
  };

export type SelectGroupedMultiItemRendererProps =
  SelectGroupedBaseGroupProps & {
    group: SelectGroupedGroupProps;
  };

export type SelectGroupedDropdownItemProps = {
  item: SelectGroupedItemProps;
  modelValue?: string;
  focused?: boolean;
};
