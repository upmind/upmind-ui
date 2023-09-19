import { computed } from "vue";
import { useMachine, useActor } from "@xstate/vue";
import { toggleMachine, toggleService } from "@upmind/flow";

export function useToggle({ useGlobal = false }) {
  const { state, send } = useGlobal
    ? useActor(toggleService)
    : useMachine(toggleMachine, {
        devTools: true
      });

  return {
    state,
    send,
    // -----------------
    count: computed(() => state.value?.context.count),
    isInactive: computed(() => ["inactive"].some(state.value.matches)),
    isDisabled: computed(() => ["disabled"].some(state.value.matches))
  };
}
