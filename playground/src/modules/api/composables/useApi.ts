// --- external
import { computed } from "vue";
import { useActor, useSelector } from "@xstate/vue";
import { interpret } from "xstate";
// --- internal
import { requestsMachine } from "@upmind/flow";
// --- utils
import { keys } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the requests machine

const service = interpret(requestsMachine, { devTools: true }).start();

// --------------------------------------------------------

export function useApi() {
  const { state, send, service } = useActor(service);

  return {
    state,
    send,
    // ---
    count: useSelector(service, ({ context }) => keys(context.requests).length),
    cache: useSelector(service, ({ context }) => context.cache),
    requests: useSelector(service, ({ context }) => context.requests),
    // ---
    isIdle: computed(() => ["inactive"].some(state.value.matches)),
    isActive: computed(() => ["disabled"].some(state.value.matches)),
    isProcessing: computed(() =>
      ["disabled.processing", "inactive.processing", "active.processing"].some(
        state.value.matches
      )
    )
  };
}
