// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useApi as useUpmindApi } from "@upmind/flow";

// --- utils
import { keys } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useApi = () => {
  const api = useUpmindApi();
  const { state } = useActor(api.service);

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    count: computed(() => keys(state.value.context.requests)?.length || 0),
    requests: computed(() => state.value.context.requests),
    isIdle: computed(() => ["loading"].some(state.value.matches)),
    isActive: computed(() => ["processing"].some(state.value.matches)),
    // ---
    useUrl: api.useUrl,
    useTime: api.useTime,
    get: api.get,
    post: api.post
  };
};
