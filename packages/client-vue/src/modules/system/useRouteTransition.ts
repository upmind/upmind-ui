// --- external
import { ref, watch } from "vue";
import { useRoutingEngine, utils } from "@upmind-automation/headless";
const { ANIMATION_DELAY, DEBOUNCE_DELAY } = utils;

// -----------------------------------------------------------------------------

const shouldShow = ref(false);
const shouldTransition = ref(false);
const transitionCallbacks = new Set<(shouldTransition: boolean) => void>();

let transitionTimer: ReturnType<typeof setTimeout> | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let initialised: boolean | undefined = undefined;
// -----------------------------------------------------------------------------

/**
 * Provides reactive state and utility functions to manage route transition animations.
 *
 * This composable is designed to coordinate UI transitions when route resolution state changes,
 * such as showing loading indicators or animating page transitions in a Vue application.
 *
 * - Watches the `isResolved` property from the routing engine's meta object.
 * - Controls two reactive flags:
 *   - `shouldShow`: Indicates whether the transition UI (e.g., a loading spinner) should be visible.
 *   - `shouldTransition`: Indicates whether the transition animation should be active.
 * - Uses debounced timers to delay the activation of transitions and visibility, preventing flicker
 *   and ensuring smooth animations.
 * - Provides a subscription mechanism (`onTransition`) for external callbacks to react to transition state changes.
 * - Exposes an `onEnter` method to be called when the transition animation starts, triggering registered callbacks.
 *
 * @returns An object containing:
 *   - `shouldShow`: `Ref<boolean>` — Whether the transition UI should be shown.
 *   - `shouldTransition`: `Ref<boolean>` — Whether the transition animation should be active.
 *   - `onTransition`: Function to subscribe to transition state changes.
 *   - `onEnter`: Function to be called when the transition animation starts.
 */
export const useRouteTransition = () => {
  const { meta: routingMeta } = useRoutingEngine();

  /**
   * Watch for changes in the route's resolved state to manage transition visibility and animation.
   * We intially indicate we need to show on our initial unresolved state, then debounce the transition and show states
   * on subsequent changes.
   * We only show when we are moving from a resolved to an unresolved state, and only after a delay to prevent unnecessary flicker/showing of loading states.
   */
  watch(
    () => routingMeta.value.isResolved,
    (isResolved, wasResolved) => {
      shouldShow.value = isResolved ? false : shouldShow.value;
      initialised = wasResolved ? true : initialised;

      if (!isResolved) {
        if (wasResolved) {
          if (showTimer) clearTimeout(showTimer);

          showTimer = setTimeout(() => {
            shouldShow.value = true;
          }, ANIMATION_DELAY);

          // NB we DONt want to transition on the initial load
          if (!initialised) return;

          // ---
          if (transitionTimer) clearTimeout(transitionTimer);
          shouldTransition.value = false;
          transitionTimer = setTimeout(() => {
            shouldTransition.value = true;
          }, DEBOUNCE_DELAY);
        } else {
          shouldShow.value = true;
          shouldTransition.value = false;
        }
      } else {
        if (showTimer) clearTimeout(showTimer);
      }
    },
    { immediate: true }
  );

  function onTransition(callback: (shouldTransition: boolean) => void) {
    transitionCallbacks.add(callback);
    return () => transitionCallbacks.delete(callback);
  }

  function onEnter() {
    if (transitionTimer) clearTimeout(transitionTimer);
    if (showTimer) clearTimeout(showTimer);

    if (shouldTransition.value) {
      transitionCallbacks.forEach(cb => cb(shouldTransition.value));
    }
  }

  return {
    shouldShow,
    shouldTransition,
    onTransition,
    onEnter
  };
};
