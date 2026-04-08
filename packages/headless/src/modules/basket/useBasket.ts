// --- external
import { computed, type ComputedRef, h } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../system";
import { useBrand } from "../brand";
import { useSession } from "../session";
import basketMachine from "./basket.machine";

// --- utils
import {
  useContext,
  compactDeep,
  ErrorOrigin,
  contextValue,
  stateMatches,
  DetailedError,
  responseCodes,
  useChildActor,
  contextMatches,
  machineMatches,
  useContextActor,
  type UseActor,
  type ResponseError
} from "../../utils";
import {
  get,
  find,
  some,
  every,
  filter,
  isEmpty,
  isEqual,
  findLast,
  sumBy
} from "lodash-es";

// --- types
import {
  type IBasket,
  type IInvoice,
  type ICurrency,
  type IPromotion,
  type IBasketPromotion,
  BrandConfigKeys,
  CheckoutFlows
} from "@upmind-automation/types";
export * from "./billing";
export * from "./types";
import type { ActorRef } from "xstate";
import type { BasketContext } from "./types";
import type { BasketProduct } from "../basketProduct";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";

// -----------------------------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(basketMachine, { devTools: true });

// -----------------------------------------------------------------------------

/**
 * Provides a comprehensive interface for managing the shopping basket state using XState.
 * It offers reactive access to basket data, meta-information about its status,
 * and methods for manipulating the basket (e.g. adding/removing items, applying promotions,
 * refreshing, and proceeding to checkout).
 */
export const useBasket = () => {
  const { t } = useI18n();
  const { includesTax, getConfigValue, uischema_Display } = useBrand();
  const { meta: sessionMeta } = useSession();
  if (service.status == InterpreterStatus.NotStarted) service.start();
  const { state, send } = useActor(service);

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => stateMatches(state, ["shopping", "unavailable", "error"]),
      { timeout: Infinity }
    ).then(state => !stateMatches(state, ["error", "unavailable"]));
  }

  const meta = computed(() => {
    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]), //

      isProcessing:
        stateMatches(state, ["shopping.refreshing.processing"]) ||
        machineMatches(actors.currency, ["processing"]) ||
        machineMatches(actors.customFields, ["processing"]) ||
        machineMatches(actors.billing, ["processing"]) ||
        machineMatches(actors.promotions, ["processing"]),

      isDirty:
        machineMatches(actors.currency, ["valid"]) ||
        machineMatches(actors.customFields, ["valid"]) ||
        machineMatches(actors.billing, ["valid"]) ||
        machineMatches(actors.promotions, ["valid"]),

      // ---
      isAvailable:
        stateMatches(state, [
          "shopping",
          "checkout.configuring",
          "checkout.available"
        ]) && contextMatches(state, ["products"]),

      isUnavailable: stateMatches(state, ["unavailable"]),

      needsAuth: !sessionMeta.value?.isAuthenticated,

      // ---
      hasProducts: contextMatches(state, ["products"]),

      hasInvalidProducts: !isEmpty(productsInvalid.value),

      hasTaxes: contextMatches(state, ["basket.taxes"]),

      hasPromotions: machineMatches(actors.promotions, ["complete"]),

      hasBilling: machineMatches(actors.billing, ["complete"]),

      hasCurrency: machineMatches(actors.currency, ["complete"]),

      hasPaymentDetails: machineMatches(actors.paymentDetail, [
        "complete",
        "available.valid",
        "processing"
      ]),

      hasFields: machineMatches(actors.customFields, ["complete"]),

      hasAccount: stateMatches(state, [
        "shopping.account.complete",
        "checkout",
        "converting",
        "paying"
      ]),

      hasTaxIncluded: includesTax.value,

      // ---
      // this state means we have a claimed basket and can pass billing details
      isReadyForBilling:
        !!actors?.billing.value &&
        !machineMatches(actors.billing, ["subscribing"]),

      // this state means we have a claimed basket and billing details set can pass payment details
      isReadyForPaymentDetails:
        !!actors?.paymentDetail.value &&
        !machineMatches(actors.paymentDetail, ["subscribing"]),

      // this state means ALL the data is ready for checkout for each parallel machine
      isReadyForCheckout: stateMatches(
        state,
        [
          "shopping.products.complete",
          "shopping.promotions.complete",
          "shopping.account.complete",
          "shopping.currency.complete",
          "shopping.billing.complete",
          "shopping.customFields.complete",
          "shopping.paymentDetail.available"
        ],
        true
      ),

      isCheckout:
        machineMatches(payment, ["approving"]) ||
        stateMatches(state, ["checkout", "converting", "paying"]),

      isProcessingDetails:
        machineMatches(payment, ["approving"]) ||
        stateMatches(state, ["shopping.paymentDetail.processing"]),
      isConverting: stateMatches(state, ["converting"]),
      isPaying: stateMatches(state, ["paying"]),
      needsApproval: machineMatches(payment, ["approving"]),
      isComplete: stateMatches(state, ["complete", "failed"]),
      hasPaid: stateMatches(state, ["complete"]),
      hasFailed: stateMatches(state, ["failed"]),
      hasErrors: contextMatches(state, ["error.code"]), //NB only show if we have single errors, not parsed BE errors
      showErrors: contextMatches(state, ["attempts"]),
      isFree:
        contextMatches(state, ["products"]) &&
        !contextValue<number>(state, "basket.total_amount", 1),

      hasCustomPrice: some(
        contextValue<IBasketPromotion[]>(state, "basket.promotions", []),
        p => !!p.promotion?.adjusted_basket_id
      )
    };
  });

  // --- Actors
  // We can create reactive actors to the child machines,
  // so that when they are invoked we can listen to their state changes
  const actors: {
    customFields: ComputedRef<UseActor | undefined>;
    paymentDetail: ComputedRef<UseActor | undefined>;
    billing: ComputedRef<UseActor | undefined>;
    currency: ComputedRef<UseActor | undefined>;
    promotions: ComputedRef<UseActor | undefined>;
  } = {
    customFields: useContextActor(state, "actors.customFields"),
    paymentDetail: useContextActor(state, "actors.paymentDetail"),
    billing: useContextActor(state, "actors.billing"),
    currency: useContextActor(state, "actors.currency"),
    promotions: useContextActor(state, "actors.promotions")
  };

  const payment = useChildActor(state, "payment");

  // --- context

  const basket = useContext<BasketContext["basket"]>(state, "basket");
  const basketId = useContext<IBasket["id"]>(state, "basket.id");
  const context = useContext<BasketContext>(state);
  const targetBasketId = useContext<BasketContext["targetBasketId"]>(
    state,
    "targetBasketId"
  );
  const currency = useContext<ICurrency>(state, "basket.currency");
  const errors = useContext<ResponseError>(state, "error");
  const invoice = useContext<IInvoice>(state, "invoice");
  const products = useContext<BasketProduct[]>(state, "products", []);
  const productsInvalid = computed(() =>
    filter(products.value, product => !isEmpty(product?.errors))
  );
  const count = computed(() =>
    sumBy<BasketProduct>(products.value, "configuration.quantity")
  );
  const attempts = useContext<BasketContext["attempts"]>(state, "attempts");
  const summary = useContext<BasketContext["summary"]>(state, "summary", 0);
  const promotions = useContext<IBasketPromotion[]>(
    state,
    "basket.promotions",
    []
  );
  const promotionCodes = computed(
    () => parsePromotionsOrCoupons(promotions.value) as IPromotion["code"][]
  );
  const taxes = useContext<IBasket["taxes"]>(state, "basket.taxes", []);

  const uischema = computed(() => {
    return {
      showPromotionsOnCheckout: !getConfigValue(
        BrandConfigKeys.CHECKOUT_HIDE_DISCOUNT_CODE_FIELD
      ),

      showProductsOnCheckout:
        uischema_Display.value?.checkout?.basketProducts === "visible" ||
        (uischema_Display.value?.checkout?.basketProducts === "on_error" &&
          !!productsInvalid.value.length),

      showFieldsOnCheckout:
        uischema_Display.value?.checkout?.basketFields === "visible" ||
        (uischema_Display.value?.checkout?.basketFields === "on_error" &&
          machineMatches(actors.customFields, ["error", "invalid"])),

      showBillingOnCheckout:
        true /* always show until we add the Billing Details Route*/ ||
        uischema_Display.value?.checkout?.basketBilling === "visible" ||
        (uischema_Display.value?.checkout?.basketBilling === "on_error" &&
          machineMatches(actors.billing, ["error", "invalid"]))
    };
  });
  // --- methods

  async function reset(): Promise<boolean> {
    send({ type: "RESET" });
    return waitFor(
      service,
      state => stateMatches(state, ["shopping", "done"]),
      { timeout: 60_000 }
    ).then(state => {
      return true;
    });
  }

  function clear() {
    return send({ type: "CLEAR" });
  }

  /**
   * Sets the target basket ID to load a specific basket by ID via URL.
   * Triggers a machine reload so the basket fetches `orders/{id}` instead of `orders/current`.
   * Pass `undefined` to revert to loading the current basket.
   * @param {string | undefined} id - The basket ID to load, or undefined to revert to `orders/current`.
   */
  async function setTargetBasket(id: string | undefined): Promise<boolean> {
    send({ type: "SET_TARGET_BASKET", data: id });
    return waitFor(
      service,
      state => stateMatches(state, ["shopping", "unavailable", "done"]),
      {
        timeout: 60_000
      }
    ).then(state => {
      if (stateMatches(state, ["unavailable"])) {
        return false;
      }

      return true;
    });
  }

  function checkout() {
    return send({ type: "CHECKOUT" });
  }

  async function refresh(data?: IBasket): Promise<IBasket | undefined> {
    send({ type: "REFRESH", data });
    return waitFor(
      service,
      state => stateMatches(state, ["shopping.refreshing.processed", "error"]),
      { timeout: 60_000 }
    )
      .then(() => contextValue<IBasket>(state, "basket"))
      .catch(() => contextValue<IBasket>(state, "basket"));
  }

  function prefresh(data: IBasket): void {
    send({ type: "PREFRESH", data });
  }

  async function setCurrency(currency: string) {
    return waitFor(service, state => stateMatches(state, ["shopping"]), {
      timeout: 60_000
    }).then(async () => {
      const actor = actors.currency;
      if (!actor.value)
        return Promise.reject(
          new DetailedError(
            t("error.currency_not_available"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );

      const code = currency?.toUpperCase();
      // Use contextValue or a similar utility to get the model from the actor's state
      const value = contextValue<any>(actor, "model") || {};

      // if it has not then bail
      if (!code || code == value?.code) return Promise.resolve(value);

      await waitFor(
        actor.value!.service,
        state => !stateMatches(state, ["loading"])
      );

      actor.value?.send({ type: "SET", data: { code }, update: true });

      // then wait for the currency actor to be updated
      return waitFor(
        actor.value!.service,
        state => {
          return stateMatches(state, [
            "processed",
            "complete",
            "error",
            "invalid"
          ]);
        },
        { timeout: 60_000 }
      )
        .then(state => {
          if (stateMatches(state, ["error", "invalid"])) {
            return Promise.reject(contextValue(state, "error"));
          }
          const value = contextValue<any>(actor, "model") || {};
          return Promise.resolve(value);
        })
        .catch(() => {
          throw new DetailedError(
            t("error.currency_update_failed"),
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              state: state.value.value
            }
          );
        });
    });
  }

  async function addPromotion(coupon: string) {
    return waitFor(service, state => stateMatches(state, ["shopping"]), {
      timeout: 60_000
    }).then(async () => {
      const actor = actors.promotions;

      if (!actor.value)
        return Promise.reject(
          new DetailedError(
            t("error.promotion_not_available"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );

      if (coupon) {
        actor.value?.send({ type: "SET", data: { promocode: coupon } });
        await waitFor(actor.value!.service, state =>
          stateMatches(state, ["valid", "error"])
        )
          .then(state => {
            if (stateMatches(state, ["error"]))
              throw contextValue(state, "error");
          })
          .catch(error => {
            return Promise.reject(
              new DetailedError(
                t("error.promotion_add_failed"),
                responseCodes.Timeout,
                ErrorOrigin.Headless,
                {
                  error,
                  state: state.value.value
                }
              )
            );
          });
      }

      actor.value?.send({ type: "ADD" });

      // wait for the promotions actor to complete the ADD operation
      return waitFor(
        actor.value!.service,
        state => {
          return stateMatches(state, ["processed", "complete", "error"]);
        },
        { timeout: 60_000 }
      ).then(state => {
        if (stateMatches(state, ["error"])) {
          return Promise.reject(
            new DetailedError(
              t("error.promotion_add_failed"),
              responseCodes.Timeout,
              ErrorOrigin.Headless,
              contextValue(state, "error")
            )
          );
        }
        return Promise.resolve();
      });
    });

    // return send({
    //   type: "UPDATE_PROMOTIONS",
    //   data: { promodcode: coupon },
    // });
  }

  // --- basket product methods

  function getProducts(): BasketProduct[] {
    return contextValue<BasketProduct[]>(state, "products", []) || [];
  }

  function findProduct(
    mapping: Record<string, any>
  ): BasketProduct | undefined {
    const cleanedMapping = compactDeep(mapping);
    const products = getProducts();
    return findLast(products, basketProduct =>
      every(cleanedMapping, (value, key) => {
        if (key == "id") {
          return basketProduct.id == value;
        } else {
          const cleanedConfig = compactDeep(basketProduct.configuration);
          const modelValue = get(cleanedConfig, key);
          return isEqual(modelValue, value);
        }
      })
    );
  }

  function findProducts(
    mapping: Record<string, any>,
    type: "configuration" | "productDetails" | "meta" = "configuration"
  ): BasketProduct[] {
    const cleanedMapping = compactDeep(mapping);
    const products = getProducts();
    return filter(products, basketProduct =>
      every(cleanedMapping, (value, key) => {
        if (key == "id") {
          return basketProduct.id == value;
        } else {
          const property = compactDeep(basketProduct[type]);
          const propertyValue = get(property, key);
          return isEqual(propertyValue, value);
        }
      })
    );
  }

  function productExists(
    mapping: Record<string, any>,
    type: "configuration" | "productDetails" | "meta" = "configuration"
  ) {
    const cleanedMapping = compactDeep(mapping);
    const products = getProducts();

    return some(products, basketProduct =>
      every(cleanedMapping, (value, key) => {
        if (key == "id") {
          return basketProduct.id == value;
        } else {
          const cleanedConfig = compactDeep(basketProduct[type]);
          const modelValue = get(cleanedConfig, key);
          return isEqual(modelValue, value);
        }
      })
    );
  }

  async function getProduct(bpid: string): Promise<ActorRef<any>> {
    await isReady();
    const target = bpid;
    const products = getProducts();
    const basketProduct = find(products, ["id", target]) as
      | ActorRef<any>
      | undefined;

    return new Promise((resolve, reject) => {
      if (basketProduct) {
        resolve(basketProduct);
      } else {
        reject(
          new DetailedError(
            t("error.basket_product_not_found"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      }
    });
  }

  function getInvalidProducts(): BasketProduct[] {
    const products = getProducts();
    return filter(products, product => !isEmpty(product?.errors));
  }

  // ---------------------------------------------------------------------------
  return {
    /**
     * Subscribes to basket state changes.
     * @see https://xstate.js.org/docs/guides/communication.html#service-subscribe
     */
    subscribe: service.subscribe.bind(service),

    // /**
    //  * The current state of the basket machine.
    //  * @typedef {Object} BasketState
    //  * @property {string} value - The current state value.
    //  * @property {Object} context - The current context of the basket machine.
    //  */
    state,

    /**
     * The full basket context object.
     */
    context,

    /**
     * Meta-information about the basket state.
     * @type {Object} BasketMeta
     * @property {boolean} isLoading - Indicates if the basket is currently loading.
     * @property {boolean} isProcessing - Indicates if the basket or any submodule is processing.
     * @property {boolean} isDirty - Indicates  that one of the submodules has been changed and the basket needs to be saved.
     * @property {boolean} isAvailable - Indicates if the basket is available for operations.
     * @property {boolean} needsAuth - Indicates if authentication is required for the basket.
     * @property {boolean} hasProducts - Indicates if the basket has products.
     * @property {boolean} hasInvalidProducts - Indicates if the basket has invalid products.
     * @property {boolean} hasTaxes - Indicates if the basket has taxes.
     * @property {boolean} hasPromotions - Indicates if the basket has promotions applied.
     * @property {boolean} hasBilling - Indicates if the basket has billing details.
     * @property {boolean} hasCurrency - Indicates if the basket has a currency set.
     * @property {boolean} hasPaymentDetails - Indicates if the basket has payment details.
     * @property {boolean} hasFields - Indicates if the basket has custom fields.
     * @property {boolean} hasAccount - Indicates if the basket has an account associated.
     * @property {boolean} hasTaxIncluded - Indicates if tax is included in the basket.
     * @property {boolean} isReadyForBilling - Indicates if the billing submodule is ready for passing billing information.
     * @property {boolean} isReadyForPaymentDetails - Indicates if the payment details submodule is ready for passing payment information.
     * @property {boolean} isReadyForCheckout - Indicates if the basket is ready for checkout.
     * @property {boolean} isCheckout - Indicates if the basket is in the checkout process.
     * @property {boolean} isProcessingDetails - Indicates if payment details are processing.
     * @property {boolean} isConverting - Indicates if the basket is converting.
     * @property {boolean} isPaying - Indicates if the basket is in the paying state.
     * @property {boolean} needsApproval - Indicates if the basket needs approval.
     * @property {boolean} isComplete - Indicates if the basket is complete.
     * @property {boolean} hasPaid - Indicates if the basket has been paid.
     * @property {boolean} hasFailed - Indicates if the basket has failed.
     * @property {boolean} hasErrors - Indicates if the basket has an error.
     */
    meta,

    // --- context

    /**
     * UI schema configuration for the basket and checkout process.
     */
    uischema,

    /**
     * Child machine actors for basket submodules (customFields, paymentDetail, etc).
     */
    actors,

    /**
     * The current basket object.
     */
    basket,

    /**
     * The current basket ID.
     */
    basketId,

    /**
     * The target basket ID currently loaded via URL, if any.
     * Set via `setTargetBasket(id)`. When set, the basket loads `orders/{id}` instead of `orders/current`.
     * Undefined when loading the default current basket.
     */
    targetBasketId,

    /**
     * The current basket currency.
     */
    currency,

    /**
     * Any error returned by the basket state machine.
     */
    errors,

    /**
     * The invoice associated with the basket, if any.
     */
    invoice,

    /**
     * The list of products in the basket.
     */
    products,

    /**
     * The list of invalid products in the basket (with errors).
     */
    productsInvalid,

    /**
     * The total number of items in the basket (sum of all product quantities).
     */
    count,

    /**
     * The number of attempts tried (for checkout, etc).
     */
    attempts,

    /**
     * The list of promotions applied to the basket.
     */
    promotions,

    /**
     * The list of promotion codes applied to the basket.
     */
    promotionCodes,

    /**
     * The basket summary (totals, etc).
     */
    summary,

    /**
     * The taxes applied to the basket.
     */
    taxes,

    // --- methods

    /**
     * Waits for the basket to be ready (shopping or error state).
     * @returns {Promise<void>} Resolves when ready, rejects on error.
     */
    isReady,

    /**
     * Clears the basket.
     */
    clear,

    /**
     * Resets the basket to its initial state. Typically used after checkout or when starting a new session.
     */
    reset,

    /**
     * Initiates the checkout process.
     */
    checkout,

    /**
     * Refreshes the basket state from the server.
     * @param {IBasket} [data] Optional basket data to refresh with.
     * @returns {Promise<IBasket>} The refreshed basket.
     */
    refresh,

    /**
     * Pre-refreshes the basket with given data without waiting for completion.
     * This gives us a way to optimistically update the basket state before a full refresh.
     * and give a perceived faster response to the user.
     * @param {IBasket} data The basket data to pre-refresh with.
     */
    prefresh,

    /**
     * Sets the basket currency.
     * @param {string} currency The currency code to set.
     * @returns {Promise<void>} Resolves when set, rejects on error.
     */
    setCurrency,

    /**
     * Adds a promotion code to the basket.
     * @param {string} coupon The promotion code to add.
     * @returns {Promise<void>} Resolves when added, rejects on error.
     */
    addPromotion,

    /**
     * Gets all products in the basket.
     * @returns {BasketProduct[]} The basket products.
     */
    getProducts,

    /**
     * Gets all invalid products in the basket (with errors).
     * @returns {BasketProduct[]} The invalid basket products.
     */
    getInvalidProducts,

    /**
     * Finds a product in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @returns {BasketProduct | undefined} The found product, or undefined.
     */
    findProduct,

    /**
     * Finds ALL products in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @param {"configuration" | "productDetails" | "meta"} type - The section of the basket product to look into (e.g., 'configuration', 'productDetails', 'meta').
     * @returns {BasketProduct[]} The found products.
     */
    findProducts,

    /**
     * Checks if a product exists in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @param {"configuration" | "productDetails" | "meta"} type - The section of the basket product to look into (e.g., 'configuration', 'productDetails', 'meta').
     * @returns {boolean} True if the product exists, false otherwise.
     */
    productExists,

    /**
     * Gets a product actor by basket product ID.
     * @param {string} bpid The basket product ID.
     * @returns {Promise<ActorRef<any>>} The product actor.
     */
    getProduct,

    /**
     * Sets the target basket ID to load a specific basket by URL.
     * Triggers a machine reload using `orders/{id}` instead of `orders/current`.
     * Pass `undefined` to revert to the current basket.
     * @param {string | undefined} id - The basket ID, or undefined to clear.
     */
    setTargetBasket
  };
};

/**
 * Represents the type definition for the `useBasket` hook.
 *
 * This type is derived from the return type of the `useBasket` function.
 * It describes the shape and structure of the value returned by the `useBasket` hook.
 *
 * The `UseBasket` type is commonly used to provide type safety and
 * ensure accurate typings when working with the `useBasket` hook in a TypeScript codebase.
 */
export type UseBasket = ReturnType<typeof useBasket>;
