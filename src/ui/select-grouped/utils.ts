// --- external
import { isArray, without, isFunction, isString } from "lodash-es";

// --- types
import type { SelectGroupedItemActionProps } from "./types";

/**
 * Shared selection logic for single and multi-item select grouped components.
 */
export interface ToggleSelectionOptions {
  currentValue: string | string[] | undefined;
  itemValue: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Toggle selection of a value. Handles both single and multiple selection modes.
 * Returns the new value to emit.
 */
export function toggleSelectionValue(
  options: ToggleSelectionOptions
): string | string[] | null {
  const { currentValue, itemValue, multiple, required, disabled } = options;

  if (disabled) return null;

  if (multiple) {
    // Multiple selection mode: add/remove from array
    const current = isArray(currentValue) ? [...currentValue] : [];
    const isSelected = current.includes(itemValue);

    if (isSelected) {
      // Deselect: only allow if not required or there are other selections
      if (!required || current.length > 1) {
        return without(current, itemValue);
      }
      return null; // Cannot deselect - would violate required constraint
    } else {
      // Select: add to current selections
      return [...current, itemValue];
    }
  } else {
    // Single selection mode: toggle or set value
    const isSelected = currentValue === itemValue;
    // Deselect if already selected and not required, otherwise select
    return isSelected && !required ? "" : itemValue;
  }
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
