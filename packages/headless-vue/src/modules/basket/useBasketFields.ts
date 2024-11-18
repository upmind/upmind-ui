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

import { isEqual } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketFields = (service?: ActorRef<any, any>) => {
  const { service: basket } = useBasket();
  const custom_fields = ref();

  if (!service) {
    waitFor(
      basket,
      newstate => contextMatches(newstate, ["actors.custom_fields"]),
      { timeout: Infinity }
    ).then(validState => {
      custom_fields.value = contextActor(validState, "actors.custom_fields");
    });
  } else {
    custom_fields.value = useActor(service);
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(custom_fields, "value")),
    context: computed(() => stateValue(custom_fields, "context")),
    errors: computed(() => contextValue(custom_fields, "error")),
    //messages: computed(()=> contextValue(custom_fields, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !custom_fields.value || stateMatches(custom_fields, ["loading"]),
      hasErrors: stateMatches(custom_fields, ["error"]),
      isProcessing: stateMatches(custom_fields, ["checking", "processing"]),
      isValid: stateMatches(custom_fields, ["valid"]),
      isDirty: contextMatches(custom_fields, ["dirty"]),
      isComplete:
        stateValue(custom_fields, "done", false) ||
        stateMatches(custom_fields, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(custom_fields, "model")),
    schema: computed(() => contextValue(custom_fields, "schema")),
    uischema: computed(() => contextValue(custom_fields, "uischema")),

    // ---
    clear: () => custom_fields.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      // @ts-ignore
      custom_fields.value?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our custom_fields has change, ie: model.code has changed
      const selected = contextValue(custom_fields, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        // @ts-ignore
        custom_fields.value?.send({ type: "SET", data: model, update: true });
      }
    },
  };
};
