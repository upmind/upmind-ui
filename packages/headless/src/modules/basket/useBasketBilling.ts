// --- external
import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useI18n } from "../system";
import { useBasket } from ".";
import { useUnified } from "./billing/unified/useUnified";

// --- utils
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  isDirty,
  responseCodes,
  stateMatches,
  stateValue,
  useContext
} from "../../utils";
import { isEmpty, isEqual, isNil, omitBy } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { BillingContext, BillingModel } from "./billing";

// -----------------------------------------------------------------------------

/**
 * Manages the basket billing process, actor,
 * and associated state, meta information, context, and other interactions
 * related to billing in the application's basket system.
 *
 * This function provides utilities for managing the billing context,
 * validating, updating, and clearing billing details, as well as
 * observing state transitions and meta-information about the billing lifecycle.
 */
export const useBasketBilling = () => {
  const { t } = useI18n();
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
        state => !stateMatches(state, ["subscribing", "loading"]),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["error"])) return false;
        return true;
      })
    );
  }

  const meta = computed(() => {
    return {
      isLoading: !actor.value || stateMatches(actor, ["loading"]),
      isAvailable:
        !!actor.value && stateMatches(actor, ["available", "complete"]),
      hasErrors: stateMatches(actor, ["error"]),
      isProcessing: stateMatches(actor, ["processing", "available.waiting"]),
      isValid: stateMatches(actor, ["available.valid"]),
      isComplete:
        stateValue(actor, "done", false) ||
        stateMatches(actor, ["processed", "complete"]),
      isDirty: isDirty(
        contextValue<BillingContext["model"]>(actor, "model"),
        contextValue<BillingContext["baseModel"]>(actor, "baseModel")
      ),
      needsAddress: !!config.value?.requiresAddress,
      needsCompany: !!config.value?.requiresCompany,
      needsPhone: !!config.value?.requiresPhone
    };
  });

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

  function set(value: BillingModel): void {
    value = omitBy(toRaw(unref(value)), isEmpty);
    actor.value?.send({ type: "SET", data: value });
  }

  async function update(value: BillingModel): Promise<void> {
    // first check if our fields have change, ie: model.code has changed
    value = omitBy(toRaw(unref(value)), isEmpty);
    actor.value?.send({ type: "SET", data: value, update: true });

    // then wait for the paymentGateway actor to be updated
    return waitFor(
      actor.value!.service,
      state =>
        stateMatches(state, [
          "processed",
          "error",
          "available.invalid",
          "complete"
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;
        return;
      })
      .catch(error => {
        throw new DetailedError(
          t("error.billing_details_update_failed"),
          responseCodes.Timeout,
          ErrorOrigin.Headless,
          {
            error,
            state: actor.value?.state.value
          }
        );
      });
  }

  function clear(): void {
    actor.value?.send({ type: "CLEAR" });
  }

  function wait(value: boolean): Promise<boolean> {
    if (value) actor.value?.send({ type: "WAIT" });
    else actor.value?.send({ type: "RESUME" });

    return waitFor(
      actor.value!.service,
      state => stateMatches(state, ["available"]),
      { timeout: Infinity }
    ).then(state => {
      return stateMatches(state, ["error"]);
    });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state

    state: computed(() => actor.value?.state?.value?.toStrings()),

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

    /** Sets the billing model without triggering an API update. */
    set,

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
     * Updates the billing if the code has changed.
     * @param {BillingModel} value The new billing model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,

    /**
     * Puts the billing actor into a wait state before re-checking for validity.
     * This is usefull if we are adding a new address or company and need to wait
     * for the actor to re-validate the billing details.
     * @returns {Promise<boolean>} Resolves true if successful, false if error.
     */
    wait,

    /**
     * Returns the unified address composable for billing details.
     * @returns {ReturnType<typeof useUnified>} The unified address composable.
     *
     */
    useUnifiedBillingDetail: useUnified
  };
};

/**
 * The return type of composable.
 */
export type UseBasketBilling = ReturnType<typeof useBasketBilling>;
