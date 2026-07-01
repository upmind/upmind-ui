import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { useBasket } from "../basket";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  isDirty,
  responseCodes,
  useContext,
  useValidationErrorsTranslator
} from "../../utils";
import {
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  DEBOUNCE_DELAY
} from "../../utils";
import { isNil, debounce } from "lodash-es";
import type { FieldsContext, FieldsModel } from "./basket-fields.types";
import type { JsonSchema7 } from "@jsonforms/core";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

/**
 * Manages the basket fields, state, and interactions.
 * Provides reactive state, context, and methods to manage basket fields.
 * Uses internal actors to manage complex state interactions, including field validation and updates.
 */
export const useBasketFields = () => {
  const { t } = useI18n();
  const { actors } = useBasket();
  const actor = actors.customFields;

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
        state => !stateMatches(state, ["loading", "checking"]),
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
    isDirty: isDirty(
      contextValue<FieldsContext["model"]>(actor, "model"),
      contextValue<FieldsContext["baseModel"]>(actor, "baseModel")
    ),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<FieldsContext>(actor);
  const fields = useContext<FieldsContext["fields"]>(actor, "fields");
  const errors = useContext<FieldsContext["error"]>(actor, "error");
  const model = useContext<FieldsContext["model"]>(actor, "model");
  const schema = useContext<FieldsContext["schema"]>(actor, "schema");
  const uischema = useContext<FieldsContext["uischema"]>(actor, "uischema");

  const translatedErrors = computed(() =>
    errors.value?.data && schema.value
      ? useValidationErrorsTranslator(
          errors.value.data,
          schema.value as JsonSchema7
        )
      : []
  );

  // --- methods

  function input(value: FieldsModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function update(
    value: FieldsModel | Record<string, any>
  ): Promise<void> {
    // first check if our fields have changed, i.e.: model.code has changed
    value = toRaw(unref(value));
    actor.value?.send({ type: "SET", data: value, update: true });

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
            t("error.basket_fields_update_failed"),
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
     * Waits for the fields actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the basket fields state.
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

    /** Errors translated to friendly, localised messages using the field schema. */
    translatedErrors,

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
    update: debounce(update, DEBOUNCE_DELAY)
  };
};

/**
 * The return type of useBasketFields composable.
 */
export type UseBasketFields = ReturnType<typeof useBasketFields>;
