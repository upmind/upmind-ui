// --- external
import { isFunction, isString } from "lodash-es";

// --- types
import type { SelectGroupedItemActionProps } from "./types";

/**
 * Shared selection logic for select grouped components.
 */
export interface ToggleSelectionOptions {
  currentValue: string | undefined;
  itemValue: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Toggle selection of a value (single selection mode).
 * Returns the new value to emit.
 */
export function toggleSelectionValue(
  options: ToggleSelectionOptions
): string | null {
  const { currentValue, itemValue, required, disabled } = options;

  if (disabled) return null;

  // Single selection mode: toggle or set value
  const isSelected = currentValue === itemValue;
  // Deselect if already selected and not required, otherwise select
  return isSelected && !required ? "" : itemValue;
}

/**
 * Handle action button click on an item.
 * Returns the action payload to emit, or calls the handler directly if it's a function.
 */
export function handleItemAction(
  action: SelectGroupedItemActionProps,
  event: Event
): { name: string; event: Event } | null {
  event.preventDefault();
  event.stopPropagation();

  if (isFunction(action.handler)) {
    action.handler(event);
    return null;
  }

  if (isString(action.handler)) {
    return {
      name: action.handler,
      event
    };
  }

  return null;
}
