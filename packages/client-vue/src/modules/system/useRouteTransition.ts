// --- external
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useRoutingEngine } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const shouldShow = ref(false);
const shouldTransition = ref(false);

export const useRouteTransition = () => {
  const route = useRoute();
  const { meta: routingMeta } = useRoutingEngine();
  watch(
    () => routingMeta.value.isResolved,
    () => {
      if (!routingMeta.value.isResolved) {
        shouldShow.value = false;
        shouldTransition.value = false;

        setTimeout(() => {
          shouldTransition.value = true;
        }, 300);

        setTimeout(() => {
          shouldShow.value = true;
        }, 1000);
      }
    },
    { immediate: true }
  );

  return {
    shouldShow,
    shouldTransition
  };
};
