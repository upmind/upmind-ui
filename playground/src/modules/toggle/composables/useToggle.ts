import { computed } from "vue";
import { useMachine, useActor } from "@xstate/vue";
import { interpret } from "xstate";

import { toggleMachine } from "@upmind/flow";

// create a global instance of the toggle machine
const service = interpret(toggleMachine, { devTools: true }).start();

// ---------------

export function useToggle({ useGlobal = true }) {
  const { state, send } = useGlobal
    ? useActor(service)
    : useMachine(toggleMachine, { devTools: true });

  return {
    state,
    send,
    // -----------------
    count: computed(() => state.value?.context.count),
    isInactive: computed(() => ["inactive"].some(state.value.matches)),
    isDisabled: computed(() => ["disabled"].some(state.value.matches)),
    isProcessing: computed(() =>
      ["disabled.processing", "inactive.processing", "active.processing"].some(
        state.value.matches
      )
    )
  };
}
