// --- external
import { computed, toRaw, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { usePayment as useUpmindPayment } from "./";

// --- utils
import {
  contextActor,
  contextMatches,
  contextValue,
  stateMatches,
  stateValue,
} from "../../utils";

// --- types
import type { PaymentArgs } from "./";

// -----------------------------------------------------------------------------

export const usePayment = (context: PaymentArgs) => {
  const { service, pay, refresh } = useUpmindPayment(context);

  // --- we need this for reactive state
  const { state } = useActor(service);

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => stateValue(state, "value")),
    context: computed(() => stateValue(state, "context")),
    errors: computed(() => contextValue(state, "error")),
    //messages: computed(()=> contextValue(state, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading: stateMatches(state, ["loading"]),
      isAvailable: !stateMatches(state, ["loading"]),
      isChecking: stateMatches(state, ["checking"]),
      isValid: stateMatches(state, ["valid"]),
      isProcessing: stateMatches(state, ["processing"]),
      needsApproval: stateMatches(state, ["approving"]),
      hasPaid: stateMatches(state, ["complete"]),
      hasFailed: stateMatches(state, ["error"]),
    })),
    // ---
    pay,
    refresh,
  };
};
