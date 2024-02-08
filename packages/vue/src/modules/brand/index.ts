// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand as useUpmindBrand } from "@upmind/flow";

// --- utils
import { isArray, isObject, reduce, set } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBrand = () => {
  const brand = useUpmindBrand();
  const { state, send } = useActor(brand.service);

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    responses: computed(() =>
      reduce(
        state.value.context,
        (result, value, key) => {
          if (key === "error") return result;

          if (isArray(value) || isObject(value)) {
            set(result, key, value);
          } else {
            set(result, `values.${key}`, value);
          }
          return result;
        },
        { values: {} }
      )
    ),
    // ---
    meta: computed(() => ({
      isLoading: state.value.matches("processing"),
      isReady: state.value.matches("complete"),
      hasErrors: [
        "organisation.error",
        "config.error",
        "settings.error",
        "modules.error",
        "currencies.error"
      ].some(state.value.matches)
    }))
  };
};
