import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { useBasket } from "../basket";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  isDirty,
  responseCodes,
  useContext
} from "../../utils";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue
} from "../../utils";
import { get, isNil } from "lodash-es";
import type { CurrencyContext, CurrencyModel } from "./basket-currency.types";
import type { ActorRef } from "xstate";

// Ceiling for waiting on the currency actor to spawn and settle. Normal boots
// resolve near-instantly; this only bounds the pathological case where the
// basket never reaches `spawnActors` (e.g. a failed basket load), so update()
// surfaces an error instead of hanging forever.
const READY_TIMEOUT = 30_000;

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

/**
 * Interacts with the basket currency context and actor.
 * Provides state, context, and methods for managing basket currency data.
 * The functionality includes checking readiness, fetching meta-information,
 * accessing context and models, and performing actions like updating or clearing currency data.
 */
export const useBasketCurrency = () => {
  const { t } = useI18n();
  const { actors, isReady: basketIsReady } = useBasket();
  const actor = actors.currency;

  // --- state

  async function isReady(): Promise<boolean> {
    // Boot the basket machine first — its `spawnActors` is what spawns the
    // currency child actor. Without this, the poll below waits forever on a
    // cold machine (e.g. currency set before any product exists).

    return basketIsReady()
      .then(() => {
        // Poll for the spawned currency actor, but with a ceiling: if the
        // basket settled into an error/unavailable state, `spawnActors` never
        // runs and the actor never appears — reject rather than poll forever
        // (and leak the interval).
        return new Promise<ActorRef<any>>((resolve, reject) => {
          const deadline = Date.now() + READY_TIMEOUT;
          const interval = setInterval(() => {
            if (!isNil(actor.value?.service)) {
              clearInterval(interval);
              resolve(actor.value.service);
            } else if (Date.now() >= deadline) {
              clearInterval(interval);
              reject(
                new DetailedError(
                  t("error.input_not_available"),
                  responseCodes.Forbidden,
                  ErrorOrigin.Headless
                )
              );
            }
          }, 100);
        });
      })
      .then(service => {
        return waitFor(
          service as ActorRef<any>,
          state => {
            return !stateMatches(state, ["subscribing", "loading", "checking"]);
          },
          // Bounded ceiling: the actor normally settles on a terminal rest
          // almost immediately, so this only bites a machine that never
          // settles — surfacing a rejection instead of an unbounded hang.
          { timeout: READY_TIMEOUT }
        ).then(state => {
          return !stateMatches(state, ["error"]);
        });
      });
  }

  const meta = computed(() => ({
    isAvailable: !!actor.value,
    isLoading: !actor.value || stateMatches(actor, ["subscribing", "loading"]),
    hasCurrency: contextMatches(actor, ["currency"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: isDirty(
      contextValue<CurrencyContext["model"]>(actor, "model.id"),
      contextValue<CurrencyContext["baseModel"]>(actor, "baseModel.id")
    ),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<CurrencyContext>(actor);
  const model = useContext<CurrencyContext["model"]>(actor, "model");
  const errors = useContext<CurrencyContext["error"]>(actor, "error");
  const schema = useContext<CurrencyContext["schema"]>(actor, "schema");
  const uischema = useContext<CurrencyContext["uischema"]>(actor, "uischema");
  const currencies = useContext<CurrencyContext["currencies"]>(
    actor,
    "currencies"
  );
  const currencyCode = useContext<CurrencyModel["code"]>(actor, "model.code");
  const currencyId = useContext<CurrencyModel["id"]>(actor, "model.id");
  const currency = useContext<CurrencyModel>(actor, "model");

  // --- methods

  async function input(value: CurrencyModel) {
    actor.value!.send({ type: "SET", data: toRaw(unref(value)) });
    return waitFor(actor.value!.service, state =>
      ["valid", "invalid", "complete"].some(state.matches)
    )
      .then(state => get(state, "context.model") as CurrencyModel)

      .catch(() => {
        return Promise.reject(
          new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        );
      });
  }

  async function update(value?: CurrencyModel): Promise<void> {
    // Wait for the machine to settle FIRST: a SET sent while it is still
    // `loading` is silently overwritten by the load's own model resolution —
    // the pick is lost, yet the machine completes and looks successful.
    await isReady();

    // first check if our currency has changed, i.e.: model.code has changed
    const code = toRaw(unref(value))?.code?.toUpperCase();
    actor.value?.send({ type: "SET", data: { code }, update: true });

    // then wait for the actor to settle. Terminal rests:
    //  - processed/complete: the server PUT ran (a basket existed)
    //  - valid: no basket yet — the pick is persisted (cantUpdate path) and
    //    order creation carries it via currency_code; the machine RESTS here,
    //    so excluding it was a guaranteed 60s hang on an empty basket
    //  - invalid/error: rejected below
    return waitFor(
      actor.value!.service,
      state => {
        return stateMatches(state, [
          "processed",
          "complete",
          "valid",
          "invalid",
          "error"
        ]);
      },
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, ["error", "invalid"]))
          throw new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless,
            state.context.error
          );

        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            t("error.currency_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              error,
              state: actor.value?.state.value
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
     * Meta-information about the basket currency state.
     * @type {Object} BasketCurrencyMeta
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

    /**
     * The current currency code.
     * @type {string | undefined} The current currency code or undefined if not set.
     */
    currencyCode,

    /** The current currency ID. */
    currencyId,

    /** The full currency model (code, id, symbol, etc.). */
    currency,

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
    update
  };
};

/**
 * Represents the return type of the `useBasketCurrency` function.
 *
 * This type defines the structure and behaviour of the value returned by invoking `useBasketCurrency`,
 * which is typically related to managing or providing information about currency in a basket or cart system.
 *
 * `useBasketCurrency` is expected to be a function that provides state management, calculations, or
 * utility methods related to handling currencies associated with the shopping basket.
 */
export type UseBasketCurrency = ReturnType<typeof useBasketCurrency>;
