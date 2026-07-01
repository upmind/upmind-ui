import { computed, toRaw, unref } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { useBasket } from "../basket";
import { useI18n } from "../system-localisation";
import {
  contextValue,
  DetailedError,
  type ErrorObject,
  ErrorOrigin,
  responseCodes,
  useContext
} from "../../utils";
import { contextMatches, stateMatches, stateValue } from "../../utils";
import { isEmpty, isEqual, isNil, map } from "lodash-es";
import type { QueryResponseError } from "../query";
import type {
  PromotionsContext,
  PromotionModel
} from "./basket-promotions.types";
import type { IBasketPromotion } from "@upmind-automation/types";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

/**
 * Manages basket promotions, providing state, context, and methods to manipulate promotions within a shopping basket.
 */
export const useBasketPromotions = () => {
  const { t } = useI18n();
  const { actors } = useBasket();
  const actor = actors.promotions;

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
    hasPromotions: contextMatches(actor, ["promotions"]),
    hasErrors: stateMatches(actor, ["error"]),
    isProcessing: stateMatches(actor, ["processing"]),
    isValid: stateMatches(actor, ["valid"]),
    isDirty: !isEmpty(contextValue<PromotionsContext["model"]>(actor, "model")),
    isComplete:
      stateValue(actor, "done", false) ||
      stateMatches(actor, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<PromotionsContext>(actor);
  const promotions = useContext<PromotionsContext["promotions"]>(
    actor,
    "promotions"
  );

  const promocodes = computed(() => map(promotions.value, "promotion.code"));

  const errors = useContext<QueryResponseError["message"]>(
    actor,
    "error.message"
  );
  const validationErrors = useContext<ErrorObject[]>(actor, "error.data");
  const model = useContext<PromotionsContext["model"]>(actor, "model");
  const schema = useContext<PromotionsContext["schema"]>(actor, "schema");
  const uischema = useContext<PromotionsContext["uischema"]>(actor, "uischema");

  // --- methods

  function input(value: PromotionModel) {
    actor.value?.send({ type: "SET", data: toRaw(unref(value)) });
  }

  async function add(value?: string): Promise<void> {
    value = toRaw(unref(value));
    const model = contextValue<PromotionModel>(actor, "model");

    if (!isEmpty(value) && !isEqual(value, model?.promocode)) {
      actor.value?.send({
        type: "SET",
        data: { promocode: value },
        update: true
      });
    } else {
      actor.value?.send({ type: "ADD" });
    }

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
            t("error.promotion_add_failed"),
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

  async function remove(value: IBasketPromotion["id"]) {
    actor.value?.send({ type: "REMOVE", data: { id: toRaw(unref(value)) } });
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
            t("error.promotion_add_failed"),
            responseCodes.Timeout,
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
     * Waits for the promotion actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the basket promotion state.
     * @typedef {Object} BasketPromotionMeta
     * @property {boolean} isAvailable - Indicates if the promotion actor is available.
     * @property {boolean} isLoading - Indicates if the promotion actor is loading.
     * @property {boolean} hasPromotion - Indicates if a promotion is set.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the promotion is processing.
     * @property {boolean} isValid - Indicates if the promotion is valid.
     * @property {boolean} isDirty - Indicates if the promotion is dirty.
     * @property {boolean} isComplete - Indicates if the promotion is complete.
     */
    meta,

    // --- context

    /** The full promotion context object. */
    context,

    /** The list of available promotions. */
    promotions,

    /** The list of promotion codes extracted from the available promotions. */
    promocodes,

    /** Any error returned by the promotion actor. */
    errors,

    /** Any validation errors returned by the promotion actor. */
    validationErrors,

    /** The current promotion model. */
    model,

    /** The promotion schema. */
    schema,

    /** The promotion UI schema. */
    uischema,

    // --- methods

    /** Clears the promotion state. */
    clear,

    /** Sends a SET event to update the promotion model.
     * @param {PromotionModel} value The new promotion model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Adds the promotion to the basket.
     * @param {PromotionModel["promocode"]} value The new promotion model.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    add,

    /**
     * Removes a promotion from the basket.
     * @param {PromotionModel} value The promotion model to remove.
     * @returns {Promise<void>} Resolves when removed, rejects on error.
     */
    remove
  };
};

/**
 * The return type of useBasketPromotions composable.
 */
export type UseBasketPromotions = ReturnType<typeof useBasketPromotions>;
