// --- external
import { ref, computed, type Ref } from "vue";
import { isEqual, isFunction, isString } from "lodash-es";

// --- types
import type {
  SelectGroupedItemActionProps,
  ToggleSelectionOptions,
  UseListNavigationOptions,
  UseListNavigationReturn,
  KeyboardHandlerOptions,
  KeyboardHandlers
} from "./types";

/**
 * Toggle selection of a value (single selection mode).
 * Returns the new value to emit.
 */
export function toggleSelectionValue(
  options: ToggleSelectionOptions
): string | null {
  const { currentValue, itemValue, required, disabled } = options;
  if (disabled) return null;
  const isSelected = isEqual(currentValue, itemValue);
  return isSelected && !required ? "" : itemValue;
}

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
    return { name: action.handler, event };
  }

  return null;
}

export function useListNavigation(
  getItemCount: () => number,
  options: UseListNavigationOptions = {}
): UseListNavigationReturn {
  const { wrap = false, orientation = "vertical", initialIndex = -1 } = options;

  const focusedIndex = ref(initialIndex);
  const hasFocus = computed(() => focusedIndex.value >= 0);

  function focusItem(index: number): void {
    const count = getItemCount();
    if (count === 0) {
      focusedIndex.value = -1;
      return;
    }

    if (wrap) {
      focusedIndex.value = ((index % count) + count) % count;
    } else {
      focusedIndex.value = Math.max(0, Math.min(index, count - 1));
    }
  }

  function focusNext(): boolean {
    const count = getItemCount();
    const currentIndex = focusedIndex.value;

    if (currentIndex < 0) {
      focusedIndex.value = 0;
      return true;
    }

    if (currentIndex >= count - 1) {
      if (wrap) {
        focusedIndex.value = 0;
        return true;
      }
      return false;
    }

    focusedIndex.value = currentIndex + 1;
    return true;
  }

  function focusPrev(): boolean {
    const count = getItemCount();
    const currentIndex = focusedIndex.value;

    if (currentIndex < 0) {
      focusedIndex.value = count - 1;
      return true;
    }

    if (currentIndex <= 0) {
      if (wrap) {
        focusedIndex.value = count - 1;
        return true;
      }
      return false;
    }

    focusedIndex.value = currentIndex - 1;
    return true;
  }

  function focusFirst(): void {
    const count = getItemCount();
    focusedIndex.value = count > 0 ? 0 : -1;
  }

  function focusLast(): void {
    const count = getItemCount();
    focusedIndex.value = count > 0 ? count - 1 : -1;
  }

  function resetFocus(): void {
    focusedIndex.value = initialIndex;
  }

  function getKeyboardHandlers(
    handlerOptions: KeyboardHandlerOptions = {}
  ): KeyboardHandlers {
    const {
      onNavigate,
      onNavigateEdge,
      preventDefault = true
    } = handlerOptions;

    const prevKeys =
      orientation === "horizontal"
        ? ["ArrowLeft"]
        : orientation === "both"
          ? ["ArrowUp", "ArrowLeft"]
          : ["ArrowUp"];

    const nextKeys =
      orientation === "horizontal"
        ? ["ArrowRight"]
        : orientation === "both"
          ? ["ArrowDown", "ArrowRight"]
          : ["ArrowDown"];

    return {
      onKeydown(event: KeyboardEvent) {
        if (prevKeys.includes(event.key)) {
          if (preventDefault) event.preventDefault();
          const moved = focusPrev();
          if (moved && onNavigate) onNavigate(focusedIndex.value, "prev");
          return;
        }

        if (nextKeys.includes(event.key)) {
          if (preventDefault) event.preventDefault();
          const moved = focusNext();
          if (moved && onNavigate) onNavigate(focusedIndex.value, "next");
          return;
        }

        if (event.key === "Home") {
          if (preventDefault) event.preventDefault();
          focusFirst();
          if (onNavigateEdge) onNavigateEdge(focusedIndex.value, "first");
          return;
        }

        if (event.key === "End") {
          if (preventDefault) event.preventDefault();
          focusLast();
          if (onNavigateEdge) onNavigateEdge(focusedIndex.value, "last");
          return;
        }
      }
    };
  }

  return {
    focusedIndex,
    hasFocus,
    focusItem,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
    resetFocus,
    getKeyboardHandlers
  };
}

export function createFocusOutHandler(
  containerRef: Ref<HTMLElement | null>,
  onFocusOut: () => void
) {
  return (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!containerRef.value?.contains(relatedTarget)) {
      onFocusOut();
    }
  };
}
