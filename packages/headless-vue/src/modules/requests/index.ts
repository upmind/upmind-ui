import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { useApi as useUpmindApi } from "@upmind-automation/headless";
import { keys } from "lodash-es";

export const useApi = (): object => {
  const api = useUpmindApi();
  const { state, send }: any = useActor(api.service);

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    meta: computed(() => ({
      isIdle: ["loading"].some(state.value.matches),
      isActive: ["processing"].some(state.value.matches),
      hasErrors: ["error"].some(state.value.matches),
    })),
    requests: computed(() => state.value.context.requests),
    count: computed(() => keys(state.value.context.requests)?.length || 0),
    useUrl: api.useUrl,
    useTime: api.useTime,
    get: api.get,
    post: api.post,
  };
};
