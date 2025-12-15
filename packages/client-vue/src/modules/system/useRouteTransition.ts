// --- external
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

// -----------------------------------------------------------------------------

const shouldShow = ref(false);
const shouldTransition = ref(false);

export const useRouteTransition = () => {
  const route = useRoute();

  watch(
    route,
    newVal => {
      shouldShow.value = newVal.path !== route.path;
      shouldTransition.value = false;

      setTimeout(() => {
        shouldTransition.value = true;
      }, 200);

      setTimeout(() => {
        shouldShow.value = true;
      }, 600);
    },
    { immediate: true }
  );

  return {
    shouldShow,
    shouldTransition
  };
};
