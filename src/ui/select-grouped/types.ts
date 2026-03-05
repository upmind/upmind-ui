// --- external
// --- types
import type {
  ItemContentItemProps,
  ItemContentActionProps
} from "../item-content";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes, Ref, ComputedRef } from "vue";

export interface ToggleSelectionOptions {
  currentValue: string | undefined;
  itemValue: string;
  required?: boolean;
  disabled?: boolean;
}

export interface UseListNavigationOptions {
  wrap?: boolean;
  orientation?: "vertical" | "horizontal" | "both";
  initialIndex?: number;
}

export interface UseListNavigationReturn {
  focusedIndex: Ref<number>;
  hasFocus: ComputedRef<boolean>;
  focusItem: (index: number) => void;
  focusNext: () => boolean;
  focusPrev: () => boolean;
  focusFirst: () => void;
  focusLast: () => void;
  resetFocus: () => void;
  getKeyboardHandlers: (options?: KeyboardHandlerOptions) => KeyboardHandlers;
}

export interface KeyboardHandlerOptions {
  onNavigate?: (index: number, direction: "next" | "prev") => void;
  onNavigateEdge?: (index: number, edge: "first" | "last") => void;
  preventDefault?: boolean;
}

export interface KeyboardHandlers {
  onKeydown: (event: KeyboardEvent) => void;
}

export type SelectGroupedItemActionProps = ItemContentActionProps;

export interface SelectGroupedItemProps extends ItemContentItemProps {
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectGroupedGroupProps {
  name?: string;
  icon?: string;
  description?: string;
  items: SelectGroupedItemProps[];
  dropdown?: boolean;
}

export interface SelectGroupedProps {
  groups: SelectGroupedGroupProps[];
  modelValue?: string;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  as?: "ul" | "ol";
  class?: HTMLAttributes["class"];
  uiConfig?: { selectGrouped: CxOptions };
}

export interface SelectGroupedBaseGroupProps {
  index?: number;
  focusedGroupIndex?: number;
  modelValue?: string;
  required?: boolean;
  disabled?: boolean;
  uiConfig?: { selectGrouped: CxOptions };
}

export interface SelectGroupedOptionRendererProps extends SelectGroupedBaseGroupProps {
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
