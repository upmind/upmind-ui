// --- external
import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from ".";
import { useUnifiedAddress } from "./billing/unifiedAddress/useUnifiedAddress";

// --- utils
import {
  DetailedError,
  responseCodes,
  useContext,
  contextMatches,
  stateMatches,
  stateValue,
  contextValue
} from "../../utils";
import { isEmpty, isEqual, isNil, omitBy } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import { BillingContext, BillingModel } from "./billing/types";

// -----------------------------------------------------------------------------

export const useBasketBilling = () => {
  const { actors } = useBasket();
  const actor = actors.billing;

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
    isAvailable:
      !!actor.value && stateMatches(actor, ["available", "complete"]),
    isLoading: !actor.value || stateMatches(actor, ["loading"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: contextMatches(actor, ["dirty"]),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<BillingContext>(actor);

  // const addresses = useContext<BillingContext["addresses"]>(
  //   actor,
  //   "addresses"
  // );
  // const companies = useContext<BillingContext["companies"]>(
  //   actor,
  //   "companies"
  // );
  // const phones = useContext<BillingContext["phones"]>(actor, "phones");

  const errors = useContext<BillingContext["error"]>(actor, "error");
  const model = useContext<BillingContext["model"]>(actor, "model");
  const schema = useContext<BillingContext["schema"]>(actor, "schema");
  const uischema = useContext<BillingContext["uischema"]>(actor, "uischema");
  const config = useContext<BillingContext["config"]>(actor, "config");

  // --- methods

  function input(value: BillingModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(value: BillingModel): Promise<void> {
    // first check if our fields have change, ie: model.code has changed
    value = omitBy(toRaw(unref(value)), isEmpty);
    const model = omitBy(contextValue<BillingModel>(actor, "model"), isEmpty);

    if (!isEmpty(value) && !isEqual(value, model)) {
      actor.value?.send({ type: "SET", data: value, update: true });
    } else {
      actor.value?.send({ type: "UPDATE" });
    }

    // then wait for the paymentGateway actor to be updated
    return waitFor(
      actor.value!.service,
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
            "[headless] update Billing Details on basket failed",
            error?.status ?? responseCodes.Timeout,
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
     * Waits for the billing actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the basket billing state.
     * @typedef {Object} BasketBillingMeta
     * @property {boolean} isAvailable - Indicates if the billing actor is available.
     * @property {boolean} isLoading - Indicates if the billing actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the billing is processing.
     * @property {boolean} isValid - Indicates if the billing is valid.
     * @property {boolean} isDirty - Indicates if the billing is dirty.
     * @property {boolean} isComplete - Indicates if the billing is complete.
     */
    meta,

    // --- context

    /** The full billing context object. */
    context,

    // /** The list of available addresses. */
    // addresses,

    // /** The list of available companies. */
    // companies,

    // /** The list of available phone numbers. */
    // phones,

    /** Any error returned by the billing actor. */
    errors,

    /** The current billing model. */
    model,

    /** The billing schema. */
    schema,

    /** The billing UI schema. */
    uischema,

    /**
     * The configuration requirements for billing .. ie doe we require a company, phone, etc.
     * @typedef {Object} BillingConfig
     * @property {boolean} company - Indicates if a company is required.
     * @property {boolean} phone - Indicates if a phone number is required.
     * @property {boolean} address - Indicates if an address is required.
     */
    config,
    // --- methods

    /** Clears the billing state. */
    clear,

    /**
     * Sends a SET event to update the billing model.
     * @param {BillingModel} value The billing model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Updates the billing if the code has changed.
     * @param {BillingModel} value The new billing model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,

    /**
     * Returns the unified address composable for billing details.
     * @returns {ReturnType<typeof useUnifiedAddress>} The unified address composable.
     *
     */
    useBillingDetail: useUnifiedAddress
  };
};

/**
 * The return type of composable.
 */
export type UseBasketBilling = ReturnType<typeof useBasketBilling>;
