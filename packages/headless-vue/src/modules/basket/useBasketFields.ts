// --- external
import { computed, ref, unref, toRaw } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "@upmind/headless";

// --- utils
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  contextActor,
} from "../../utils";

// --- types
import type { TActor } from "./types";
import { isEqual } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machinewith some state helpers
// We allow an actor to be passed in, but if not, we will use the basket service and wait for the 'actor'' machine to be ready

export const useBasketFields = (actor?: TActor<any>) => {
  const { service, getSnapshot } = useBasket();
  const custom_fields = ref(actor);

  if (!actor) {
    waitFor(
      service,
      newstate => ["checkout", "shopping"].some(newstate.matches),
      { timeout: Infinity }
    ).then(validState => {
      custom_fields.value = contextActor(validState, "actors.custom_fields");
    });
  }

  // --------------------------------------------------------

  return {
    state: computed(() => stateValue(custom_fields.value?.state, "value")),
    context: computed(() => stateValue(custom_fields.value?.state, "context")),
    errors: computed(() => contextValue(custom_fields.value?.state, "error")),
    //messages: computed(()=> contextValue(custom_fields.value?.state, 'messages')),
    // ---
    meta: computed(() => ({
      isLoading:
        !custom_fields.value?.state ||
        stateMatches(custom_fields.value?.state, ["loading"]) ||
        stateMatches(getSnapshot(), [
          "subscribing",
          "loading",
          "generating",
          "claiming",
        ]),
      hasErrors: stateMatches(custom_fields.value?.state, ["error"]),
      isProcessing: stateMatches(custom_fields.value?.state, [
        "checking",
        "processing",
      ]),
      isValid: stateMatches(custom_fields.value?.state, ["valid"]),
      isDirty: contextMatches(custom_fields.value?.state, ["dirty"]),
      isComplete:
        stateValue(custom_fields.value?.state, "done", false) ||
        stateMatches(custom_fields.value?.state, ["processed", "complete"]),
    })),
    // ---
    model: computed(() => contextValue(custom_fields.value?.state, "model")),
    schema: computed(() => contextValue(custom_fields.value?.state, "schema")),
    uischema: computed(() =>
      contextValue(custom_fields.value?.state, "uischema")
    ),

    // ---
    clear: () => custom_fields.value?.send({ type: "CLEAR" }),
    input: (model: any) =>
      // @ts-ignore
      custom_fields.value?.send({ type: "SET", data: model }),
    update(model: any) {
      model = toRaw(unref(model));
      if (!model) return;

      // first check if our custom_fields has change, ie: model.code has changed
      const selected = contextValue(custom_fields.value?.state, "model");

      // if it has not then bail
      if (!isEqual(selected, model)) {
        // if it has then send the new model to the machine
        // @ts-ignore
        custom_fields.value?.send({ type: "SET", data: model, update: true });
      }
    },
  };
};
