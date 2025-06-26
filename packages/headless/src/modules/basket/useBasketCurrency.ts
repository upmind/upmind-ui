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
} from "../../utils";
import { get, isNil } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { CurrencyContext, CurrencyModel } from "./currency/types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

export const useBasketCurrency = () => {
  const { actors } = useBasket();
  const actor = actors.currency;

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!isNil(actor.value?.service)) {
          clearInterval(interval);
          resolve(actor.value.service);
        }
      }, 100);
    }).then(service =>
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
    hasCurrency: contextMatches(actor, ["currency"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"]),
  }));

  // --- context

  const context = useContext<CurrencyContext>(actor);
  const currencies = useContext<CurrencyContext["currencies"]>(
    actor,
    "currencies"
  );
  const errors = useContext<CurrencyContext["error"]>(actor, "error");
  const model = useContext<CurrencyContext["model"]>(actor, "model");
  const schema = useContext<CurrencyContext["schema"]>(actor, "schema");
  const uischema = useContext<CurrencyContext["uischema"]>(actor, "uischema");

  // --- methods

  function input(value: CurrencyModel) {
    actor.value!.send({ type: "SET", data: toRaw(unref(value)) });
    return waitFor(actor.value!.service, state =>
      ["available.valid", "available.invalid"].some(state.matches)
    )
      .then(state => get(state, "context.model") as CurrencyModel)

      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  }

  async function update(value: CurrencyModel): Promise<void> {
    // first check if our currency has change, ie: model.code has changed

    const code = toRaw(unref(value))?.code?.toUpperCase();
    const model = contextValue<CurrencyModel>(actor, "model");

    // if it has not then bail
    if (!code || code == model?.code) return Promise.resolve();

    actor.value?.send({ type: "SET", data: { code }, update: true });

    // then wait for the paymentGateway actor to be updated
    return waitFor(
      actor.value!.service,
      state => {
        return stateMatches(state, ["processed", "complete", "error"]);
      },
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;

        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Currency on basket failed",
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

    /**
     * Sends a SET event to update the currency model.
     * @param {CurrencyModel} value The currency model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Updates the currency if the code has changed.
     * @param {CurrencyModel} value The new currency model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,
  };
};

/**
 * The return type of useBasketCurrency composable.
 */
export type UseBasketCurrency = ReturnType<typeof useBasketCurrency>;
