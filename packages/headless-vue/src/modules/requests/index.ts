// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useApi as useUpmindApi } from "@upmind/headless";

// --- utils
import { keys } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useApi = (): any => {
  const api = useUpmindApi();
  const { state, send }: any = useActor(api.service);

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isIdle: ["loading"].some(state.value.matches),
      isActive: ["processing"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
    })),
    //  ---
    requests: computed(() => state.value.context.requests),
    count: computed(() => keys(state.value.context.requests)?.length || 0),
    // ---
    useUrl: api.useUrl,
    useTime: api.useTime,
    get: api.get,
    post: api.post,
  };
};
