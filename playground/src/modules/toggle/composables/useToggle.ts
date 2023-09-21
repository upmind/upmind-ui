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

// --------------------------------------------------------

export function useToggle({ useGlobal = true }) {
  const {
    state,
    send,
    service = shared
  } = useGlobal
    ? useActor(shared)
    : useMachine(toggleMachine, { devTools: false });

  return {
    state,
    send,
    // ---
    count: useSelector(service, ({ context }) => context.count),
    isInactive: computed(() => ["inactive"].some(state.value.matches)),
    isDisabled: computed(() => ["disabled"].some(state.value.matches)),
    isProcessing: computed(() =>
      ["disabled.processing", "inactive.processing", "active.processing"].some(
        state.value.matches
      )
    )
  };
}
