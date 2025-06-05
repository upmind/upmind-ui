// --- external
import { computed, toRaw, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { usePaymentDetails as useUpmindPaymentDetails } from "./";

// --- utils
import {
  contextActor,
  contextMatches,
  contextValue,
  stateMatches,
  stateValue,
} from "../../utils";

// --- types
import type { PaymentDetailsArgs } from "./";

// -----------------------------------------------------------------------------

export const usePaymentDetails = (context: PaymentDetailsArgs) => {
  const { service, clear, update, checkout, refresh } =
    useUpmindPaymentDetails(context);

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
      isFree: !contextValue(state, "model.amount"),
      isLoading: stateMatches(state, ["loading"]),
      isAvailable:
        stateMatches(state, ["available"]) &&
        !stateMatches(state, ["available.loading"]),
      hasErrors: stateMatches(state, ["error"]),
      isProcessing: stateMatches(state, ["checking", "processing"]),
      isValid: stateMatches(state, ["valid"]),
      isDirty: contextMatches(state, ["dirty"]),
      hasGateway: contextMatches(state, ["actors.gateway"]),
      isComplete:
        !contextValue(state, "model.amount") ||
        stateValue(state, "done", false) ||
        stateMatches(state, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(state, "model")),
    schema: computed(() => contextValue(state, "schema")),
    uischema: computed(() => contextValue(state, "uischema")),
    gateways: computed(() => contextValue(state, "gateways")),
    gateway: computed(() => contextActor(state, "actors.gateway")),

    // ---
    update: (model: any) => update(toRaw(unref(model))),
    clear,
    checkout,
    refresh,
  };
};
