// --- external
import { ref, watch } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import {
  useRoutingEngine,
  ANIMATION_DELAY,
  DEBOUNCE_DELAY
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const shouldShow = ref(false);
const shouldTransition = ref(false);
const transitionCallbacks = new Set<(value: boolean) => void>();
let initialised: boolean | undefined = undefined;

// -----------------------------------------------------------------------------
/**
 * Manages route transition animations by watching routing resolution state.
 */
export const useRouteTransition = () => {
  const { meta } = useRoutingEngine();

  const { start: startShow, stop: stopShow } = useTimeoutFn(
    () => {
      shouldShow.value = true;
    },
    ANIMATION_DELAY,
    { immediate: false }
  );

  const { start: startTransition, stop: stopTransition } = useTimeoutFn(
    () => {
      shouldTransition.value = true;
    },
    DEBOUNCE_DELAY,
    { immediate: false }
  );

  watch(
    () => meta.value.isResolved,
    (isResolved, wasResolved) => {
      initialised = wasResolved ? true : initialised;

      if (!isResolved && initialised) {
        shouldShow.value = false;
        startShow();
        shouldTransition.value = false;
        startTransition();
      } else if (!initialised) {
        shouldShow.value = true;
        shouldTransition.value = false;
      }
    },
    { immediate: true }
  );

  function reset() {
    stopShow();
    stopTransition();
    shouldShow.value = false;
    shouldTransition.value = false;
  }

  function onEnter() {
    stopShow();
    stopTransition();
    if (shouldTransition.value) {
      transitionCallbacks.forEach(cb => cb(shouldTransition.value));
    }
  }

  function onTransition(callback: (value: boolean) => void) {
    transitionCallbacks.add(callback);
    return () => transitionCallbacks.delete(callback);
  }

  return {
    /** Whether to show loading UI. */
    shouldShow,
    /** Whether transition animation should be active. */
    shouldTransition,
    /** Called when Vue Transition enter phase starts. */
    onEnter,
    /** Subscribe to transition state changes. */
    onTransition,
    /** Reset transition state. */
    reset
  };
};
