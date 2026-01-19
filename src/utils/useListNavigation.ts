// --- external
import { ref, computed, type Ref, type ComputedRef } from "vue";

// -----------------------------------------------------------------------------

export interface UseListNavigationOptions {
  /** Whether to wrap around when reaching the end/start of the list */
  wrap?: boolean;
  /** Orientation for keyboard mapping (vertical: up/down, horizontal: left/right) */
  orientation?: "vertical" | "horizontal" | "both";
  /** Initial focused index */
  initialIndex?: number;
}

export interface UseListNavigationReturn {
  /** Currently focused index (0-based) */
  focusedIndex: Ref<number>;
  /** Whether any item is currently focused */
  hasFocus: ComputedRef<boolean>;
  /** Move focus to a specific index (clamped or wrapped to bounds) */
  focusItem: (index: number) => void;
  /** Move focus to the next item */
  focusNext: () => boolean;
  /** Move focus to the previous item */
  focusPrev: () => boolean;
  /** Move focus to the first item */
  focusFirst: () => void;
  /** Move focus to the last item */
  focusLast: () => void;
  /** Reset focus to initial state (-1 = no focus) */
  resetFocus: () => void;
  /** Get keyboard event handlers for attachment to elements */
  getKeyboardHandlers: (options?: KeyboardHandlerOptions) => KeyboardHandlers;
}

export interface KeyboardHandlerOptions {
  /** Callback when navigation occurs (after focus change) */
  onNavigate?: (index: number, direction: "next" | "prev") => void;
  /** Callback when Home/End is pressed */
  onNavigateEdge?: (index: number, edge: "first" | "last") => void;
  /** Whether to prevent default on navigation keys */
  preventDefault?: boolean;
}

export interface KeyboardHandlers {
  onKeydown: (event: KeyboardEvent) => void;
}

/**
 * Composable for keyboard navigation in list-based components.
 * Provides focus management and keyboard handlers for arrow key navigation.
 *
 * @example
 * ```ts
 * const items = ref(['a', 'b', 'c']);
 * const { focusedIndex, focusNext, focusPrev, getKeyboardHandlers } = useListNavigation(
 *   () => items.value.length
 * );
 *
 * // In template: @keydown="getKeyboardHandlers().onKeydown"
 * ```
 */
export function useListNavigation(
  /** Function that returns the current item count (reactive) */
  getItemCount: () => number,
  options: UseListNavigationOptions = {}
): UseListNavigationReturn {
  const { wrap = false, orientation = "vertical", initialIndex = -1 } = options;

  const focusedIndex = ref(initialIndex);

  const hasFocus = computed(() => focusedIndex.value >= 0);

  /**
   * Move focus to a specific index, clamping or wrapping to bounds
   */
  function focusItem(index: number): void {
    const count = getItemCount();
    if (count === 0) {
      focusedIndex.value = -1;
      return;
    }

    if (wrap) {
      // Wrap around: -1 goes to last, count goes to first
      focusedIndex.value = ((index % count) + count) % count;
    } else {
      // Clamp to bounds
      focusedIndex.value = Math.max(0, Math.min(index, count - 1));
    }
  }

  /**
   * Move focus to the next item
   * @returns true if focus moved, false if at boundary (and not wrapping)
   */
  function focusNext(): boolean {
    const count = getItemCount();
    const currentIndex = focusedIndex.value;

    // If not focused, start at first item
    if (currentIndex < 0) {
      focusedIndex.value = 0;
      return true;
    }

    // Check if at end
    if (currentIndex >= count - 1) {
      if (wrap) {
        focusedIndex.value = 0;
        return true;
      }
      return false; // At boundary, didn't move
    }

    focusedIndex.value = currentIndex + 1;
    return true;
  }

  /**
   * Move focus to the previous item
   * @returns true if focus moved, false if at boundary (and not wrapping)
   */
  function focusPrev(): boolean {
    const count = getItemCount();
    const currentIndex = focusedIndex.value;

    // If not focused, start at last item
    if (currentIndex < 0) {
      focusedIndex.value = count - 1;
      return true;
    }

    // Check if at start
    if (currentIndex <= 0) {
      if (wrap) {
        focusedIndex.value = count - 1;
        return true;
      }
      return false; // At boundary, didn't move
    }

    focusedIndex.value = currentIndex - 1;
    return true;
  }

  /**
   * Move focus to the first item
   */
  function focusFirst(): void {
    const count = getItemCount();
    focusedIndex.value = count > 0 ? 0 : -1;
  }

  /**
   * Move focus to the last item
   */
  function focusLast(): void {
    const count = getItemCount();
    focusedIndex.value = count > 0 ? count - 1 : -1;
  }

  /**
   * Reset focus to initial state
   */
  function resetFocus(): void {
    focusedIndex.value = initialIndex;
  }

  /**
   * Get keyboard event handlers for attachment to elements
   */
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
        // Previous navigation
        if (prevKeys.includes(event.key)) {
          if (preventDefault) event.preventDefault();
          const moved = focusPrev();
          if (moved && onNavigate) {
            onNavigate(focusedIndex.value, "prev");
          }
          return;
        }

        // Next navigation
        if (nextKeys.includes(event.key)) {
          if (preventDefault) event.preventDefault();
          const moved = focusNext();
          if (moved && onNavigate) {
            onNavigate(focusedIndex.value, "next");
          }
          return;
        }

        // Home key - go to first
        if (event.key === "Home") {
          if (preventDefault) event.preventDefault();
          focusFirst();
          if (onNavigateEdge) {
            onNavigateEdge(focusedIndex.value, "first");
          }
          return;
        }

        // End key - go to last
        if (event.key === "End") {
          if (preventDefault) event.preventDefault();
          focusLast();
          if (onNavigateEdge) {
            onNavigateEdge(focusedIndex.value, "last");
          }
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

// -----------------------------------------------------------------------------
// Focus trap utility for dropdowns/modals
// -----------------------------------------------------------------------------

export interface UseFocusTrapOptions {
  /** Ref to the container element */
  containerRef: Ref<HTMLElement | null>;
  /** Callback when focus leaves the container */
  onFocusOut?: () => void;
}

/**
 * Utility to detect when focus leaves a container element.
 * Useful for closing dropdowns when user tabs away.
 */
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
