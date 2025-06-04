// --- external
import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "./";

// --- utils
import { DetailedError, responseCodes, useContext } from "../../utils";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  DEBOUNCE_DELAY,
} from "../../utils";
import { isNil, debounce, isEqual } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { FieldsContext, FieldsModel } from "./fields/types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketFields = () => {
  const { actors, state } = useBasket();
  const service = useContext<ActorRef<any>>(state, "actors.customFields");
  const actor = actors.customFields;

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve =>
      setTimeout(() => {
        if (!isNil(service.value)) {
          resolve(service.value);
        }
      }, 100)
    ).then(service =>
      waitFor(
        service as ActorRef<any>,
        state => !stateMatches(state, "loading"),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["error"])) return false;
        return true;
      })
    );
  }

  const meta = computed(() => ({
    isAvailable: !!actor.value,
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasFields: contextMatches(actor, ["fields"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
  }));

  // --- context

  const context = useContext<FieldsContext>(actor);
  const fields = useContext<FieldsContext["fields"]>(actor, "fields");
  const errors = useContext<FieldsContext["error"]>(actor, "error");
  const model = useContext<FieldsContext["model"]>(actor, "model");
  const schema = useContext<FieldsContext["schema"]>(actor, "schema");
  const uischema = useContext<FieldsContext["uischema"]>(actor, "uischema");

  // --- methods

  function input(value: FieldsModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(value: FieldsModel): Promise<void> {
    // first check if our fields have change, ie: model.code has changed
    value = toRaw(unref(value));
    const model = contextValue<FieldsModel>(service, "model");

    // if it has not then bail
    if (!value || isEqual(model, value)) {
      actor.value?.send({ type: "SET", data: value, update: true });
    } else {
      actor.value?.send({ type: "UPDATE" });
    }
    // then wait for the paymentGateway actor to be updated
    return waitFor(
      service.value as ActorRef<any>,
      state => stateMatches(state, ["processed", "complete", "error"]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;

        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Fields on basket failed",
            error?.status ?? responseCodes.Timeout,
            {
              error,
              state: actor.value?.state.value,
            }
          )
        );
      });
  }

  function clear(): void {
    actor.value?.send({ type: "CLEAR" });
  }
  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Waits for the fields actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the basket fields state.
     * @typedef {Object} BasketFieldsMeta
     * @property {boolean} isAvailable - Indicates if the fields actor is available.
     * @property {boolean} isLoading - Indicates if the fields actor is loading.
     * @property {boolean} hasFields - Indicates if a fields is set.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the fields is processing.
     * @property {boolean} isValid - Indicates if the fields is valid.
     * @property {boolean} isDirty - Indicates if the fields is dirty.
     * @property {boolean} isComplete - Indicates if the fields is complete.
     */
    meta,

    // --- context

    /** The full fields context object. */
    context,

    /** The list of available fields. */
    fields,

    /** Any error returned by the fields actor. */
    errors,

    /** The current fields model. */
    model,

    /** The fields schema. */
    schema,

    /** The fields UI schema. */
    uischema,

    // --- methods

    /** Clears the fields state. */
    clear,

    /** Sends a SET event to update the fields model.
     * @param {FieldsModel} value The fields model to set.
     * @returns {void} Does not return anything.
     */

    input,

    /**
     * Updates the fields if the code has changed.
     * @param {FieldsModel} value The new fields model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update: debounce(update, DEBOUNCE_DELAY),
  };
};

/**
 * The return type of useBasketFields composable.
 */
export type UseBasketFields = ReturnType<typeof useBasketFields>;
