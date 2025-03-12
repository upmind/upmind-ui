// --- external
import { computed, ref, unref, toRaw } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  contextActor,
} from "../../utils";

import { isEqual, debounce } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketFields = (service?: ActorRef<any>) => {
  const { service: basket } = useBasket();
  const customFields = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.customFields"]),
      { timeout: Infinity }
    ).then(validState => {
      customFields.value = contextActor(validState, "actors.customFields");
    });
  } else {
    customFields.value = useActor(service);
  }

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => stateValue(customFields, "value")),
    context: computed(() => stateValue(customFields, "context")),
    errors: computed(() => contextValue(customFields, "error")),
    //messages: computed(()=> contextValue(customFields, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading: !customFields.value || stateMatches(customFields, ["loading"]),
      hasErrors: stateMatches(customFields, ["error"]),
      isProcessing: stateMatches(customFields, ["checking", "processing"]),
      isValid: stateMatches(customFields, ["valid"]),
      isDirty: contextMatches(customFields, ["dirty"]),
      isComplete:
        stateValue(customFields, "done", false) ||
        stateMatches(customFields, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(customFields, "model")),
    schema: computed(() => contextValue(customFields, "schema")),
    uischema: computed(() => contextValue(customFields, "uischema")),

    // ---
    clear: () => customFields.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      customFields.value?.send({ type: "SET", data: model }),

    // debounce as we tend  to update on input as opposed to submitting
    update: debounce((model: any) => {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our customFields has change, ie: model.code has changed
      const selected = contextValue(customFields, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine

        customFields.value?.send({ type: "SET", data: model, update: true });
      }
    }, 500),
  };
};
