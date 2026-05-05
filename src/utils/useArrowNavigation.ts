// --- external
import type { Ref } from "vue";
import { clamp } from "lodash-es";
// -----------------------------------------------------------------------------

export type ArrowOrientation = "horizontal" | "vertical" | "both";

export type UseArrowNavigationOptions<T extends HTMLElement> = {
  refs: Ref<T[] | null>;
  count: () => number;
  onSelect: (index: number) => void;
  orientation?: ArrowOrientation;
  /** Stop the keydown bubbling once handled. Default `true` — defensive for
   *  nested keyboard widgets (e.g. Carousel). */
  stopPropagation?: boolean;
};

const ARROW_STEP: Record<ArrowOrientation, Record<string, number>> = {
  horizontal: { ArrowRight: 1, ArrowLeft: -1 },
  vertical: { ArrowDown: 1, ArrowUp: -1 },
  both: { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
};

/**
 * Roving-focus arrow navigation for a list of focusable items where selection
 * follows focus (e.g. carousels, tab strips). Stateless — the caller owns the
 * current index and updates it via `onSelect`.
 *
 * Bind the returned `onKey` on each item's `@keydown` with the item's index.
 * Arrow keys, Home and End move focus and trigger `onSelect(target)`. Events
 * are `preventDefault`'d when handled, and `stopPropagation`'d unless opted out.
 */
export function useArrowNavigation<T extends HTMLElement = HTMLElement>(
  options: UseArrowNavigationOptions<T>
) {
  const {
    refs,
    count,
    onSelect,
    orientation = "horizontal",
    stopPropagation = true
  } = options;

  function targetFor(
    key: string,
    current: number,
    last: number
  ): number | null {
    if (key === "Home") return 0;
    if (key === "End") return last;
    const step = ARROW_STEP[orientation][key];
    if (step === undefined) return null;
    return clamp(current + step, 0, last);
  }

  function onKey(event: KeyboardEvent, currentIndex: number) {
    const target = targetFor(event.key, currentIndex, count() - 1);
    if (target === null || target === currentIndex) return;
    event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    onSelect(target);
    refs.value?.[target]?.focus({ preventScroll: true });
  }

  return { onKey };
}
