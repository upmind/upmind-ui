// --- external
import { computed, ComputedRef } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { BasketContext, useBasket } from "./";

// --- utils
import { DetailedError, responseCodes, useContext } from "../../utils";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
} from "../../utils";
import { isNil } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { CurrencyContext, CurrencyModel } from "./currency/types";
import { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketCurrency = (actorRef?: ActorRef<any>) => {
  const { actors, state } = useBasket();
  let service: ComputedRef<ActorRef<any> | undefined> = !actorRef
    ? useContext(state, "actors.currency")
    : computed(() => actorRef);
  const actor = !actorRef ? actors.currency : useActor(actorRef);

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
        {
          timeout: Infinity, // infinity = no timeout
        }
      ).then(state => {
        if (stateMatches(state, ["error"])) return false;
        return true;
      })
    );
  }

  const meta = computed(() => ({
    isAvailable: !!actor.value,
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasCurrency: contextMatches(actor, ["currency"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["checking", "processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
  }));

  // --- context

  const context = useContext<CurrencyContext>(actor);
  const currencies = useContext(actor, "currencies");
  const errors = useContext(actor, "error");
  const model = useContext(actor, "model");
  const schema = useContext(actor, "schema");
  const uischema = useContext(actor, "uischema");

  // --- methods

  function input(model: any) {
    actor.value?.send({ type: "SET", data: model });
  }

  async function update(model: any): Promise<void> {
    // first check if our currency has change, ie: model.code has changed

    const code = model?.code?.toUpperCase();
    const value = contextValue<CurrencyModel>(service, "model");

    // if it has not then bail
    if (!code || code == value?.code) return Promise.resolve();

    actor.value?.send({ type: "SET", data: { code }, update: true });

    // then wait for the paymentGateway actor to be updated
    return waitFor(
      service.value as ActorRef<any>,
      state => {
        return ["processed", "complete", "error"].some(state.matches);
      },
      { timeout: 60_000 }
    )
      .then(state => {
        if (["error"].some(state.matches)) {
          return Promise.reject(new Error(state.context.error));
        }
        return Promise.resolve();
      })
      .catch(() => {
        throw new DetailedError(
          `[headless-vue] fetch on useBasketCurrency timed out while waiting for currency update to complete`,
          responseCodes.Timeout
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
     * Waits for the currency actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the basket currency state.
     * @typedef {Object} BasketCurrencyMeta
     * @property {boolean} isAvailable - Indicates if the currency actor is available.
     * @property {boolean} isLoading - Indicates if the currency actor is loading.
     * @property {boolean} hasCurrency - Indicates if a currency is set.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the currency is processing.
     * @property {boolean} isValid - Indicates if the currency is valid.
     * @property {boolean} isDirty - Indicates if the currency is dirty.
     * @property {boolean} isComplete - Indicates if the currency is complete.
     */
    meta,

    // --- context

    /** The full currency context object. */
    context,

    /** The list of available currencies. */
    currencies,

    /** Any error returned by the currency actor. */
    errors,

    /** The current currency model. */
    model,

    /** The currency schema. */
    schema,

    /** The currency UI schema. */
    uischema,

    // --- methods

    /** Clears the currency state. */
    clear,

    /** Sends a SET event to update the currency model.
     * @param {any} model The new currency model to set.
     * @returns {void} Does not return anything.
     */

    input,

    /**
     * Updates the currency if the code has changed.
     * @param {any} model The new currency model.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,
  };
};

/**
 * The return type of useBasketCurrency composable.
 */
export type UseBasketCurrencyReturn = ReturnType<typeof useBasketCurrency>;
