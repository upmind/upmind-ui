// --- external
import { ref, watch } from "vue";
import { useRoutingEngine } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const shouldShow = ref(false);
const shouldTransition = ref(false);
const transitionCallbacks = new Set<() => void>();

let transitionTimer: ReturnType<typeof setTimeout> | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

// -----------------------------------------------------------------------------

export const useRouteTransition = () => {
  const { meta: routingMeta } = useRoutingEngine();

  if (!initialized) {
    initialized = true;

    watch(
      () => routingMeta.value.isResolved,
      (isResolved, wasResolved) => {
        if (!isResolved && wasResolved !== false) {
          if (transitionTimer) clearTimeout(transitionTimer);
          if (showTimer) clearTimeout(showTimer);

          shouldShow.value = false;
          shouldTransition.value = false;

          transitionTimer = setTimeout(() => {
            shouldTransition.value = true;
          }, 300);

          showTimer = setTimeout(() => {
            shouldShow.value = true;
          }, 1000);
        }
      },
      { immediate: true }
    );
  }

  function onTransition(callback: () => void) {
    transitionCallbacks.add(callback);
    return () => transitionCallbacks.delete(callback);
  }

  function onEnter() {
    if (transitionTimer) clearTimeout(transitionTimer);
    if (showTimer) clearTimeout(showTimer);

    if (shouldTransition.value) {
      transitionCallbacks.forEach(cb => cb());
    }
  }

  return {
    shouldShow,
    shouldTransition,
    onTransition,
    onEnter
  };
};
