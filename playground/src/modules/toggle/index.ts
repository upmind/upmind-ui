// --- external
import { computed } from "vue";
import { useMachine, useActor, useSelector } from "@xstate/vue";
import { interpret } from "xstate";
// --- internal
import { toggleMachine } from "@upmind/flow";
// --- utils
// import {} from 'lodash-es';

// --------------------------------------------------------
// create a global instance of the toggle machine

const shared = interpret(toggleMachine, { devTools: false }).start();

// ---

// --------------------------------------------------------

export function useToggle({ useGlobal = true }) {
  // ---
  const {
    state,
    send,
    service = shared
  } = useGlobal
    ? useActor(shared)
    : useMachine(toggleMachine, { devTools: false });

  // ---
  function reset() {
    send("RESET");
  }

  function toggle() {
    send("TOGGLE");
  }
  // ---
  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["starting"].some(state.value.matches),
      hasErrors: ["starting.status.error"].some(state.value.matches),
      isInactive: ["inactive"].some(state.value.matches),
      isDisabled: ["disabled"].some(state.value.matches),
      isProcessing: [
        "disabled.processing",
        "inactive.processing",
        "active.processing"
      ].some(state.value.matches)
    })),
    // ---
    count: useSelector(service, ({ context }) => context.count),
    // ---
    toggle,
    reset
  };
}
