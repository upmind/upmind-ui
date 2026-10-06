// -----------------------------------------------------------------------------
/**
 * @module composables/useLgViewport
 * @description The one chrome breakpoint the portal switches single-mount
 * chrome on (`lg`) — the action pane's column-or-drawer, and the pane
 * trigger that only renders while the pane is off-canvas.
 *
 * It defaults to the DESKTOP branch and corrects on mount, exactly as
 * `@upmind/ui`'s own `lib/use-media-query.ts` does: that package exports it
 * only through `./lib/*`, which this app's `@upmind/ui` alias (a bare path to
 * `src/index.ts`) cannot resolve.
 */

import { onBeforeUnmount, onMounted, ref } from "vue";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------

/** Tailwind's `lg` — the same query the library's chrome switches on. */
export const LG_MEDIA_QUERY = "(min-width: 64rem)";

export function useLgViewport(): Ref<boolean> {
  const matches = ref(true);
  let query: MediaQueryList | undefined;

  function update(): void {
    if (query) matches.value = query.matches;
  }

  onMounted(() => {
    const unsupported =
      typeof window === "undefined" || typeof window.matchMedia !== "function";
    if (unsupported) return;
    query = window.matchMedia(LG_MEDIA_QUERY);
    update();
    query.addEventListener("change", update);
  });

  onBeforeUnmount(() => {
    query?.removeEventListener("change", update);
  });

  return matches;
}
