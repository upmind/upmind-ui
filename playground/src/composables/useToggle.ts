import { computed } from "vue";
import { useMachine } from "@xstate/vue";
import toggleMachine from "@/machines/toggle";

export function useToggle() {
  const { state, send, service } = useMachine(toggleMachine, {
    devTools: true
  });

  return {
    state,
    send,
    service,
    // -----------------
    count: computed(() => state.value?.context.count),
    isInactive: computed(() => ["inactive"].some(state.value.matches)),
    isDisabled: computed(() => ["disabled"].some(state.value.matches))
  };
}
