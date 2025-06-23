// --- external
import { computed, ComputedRef } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand } from "../brand";
import { useSession } from "../session";
import basketMachine from "./basket.machine";

// --- utils
import {
  DetailedError,
  compactDeep,
  useContextActor,
  contextMatches,
  contextValue,
  machineMatches,
  responseCodes,
  stateMatches,
  useChildActor,
  useContext,
  Actor,
  ErrorOrigin,
} from "../../utils";

import {
  every,
  filter,
  find,
  findLast,
  get,
  isEmpty,
  map,
  isEqual,
  some,
} from "lodash-es";

// --- types
export * from "./billing";
export * from "./types";
import type { ActorRef } from "xstate";
import type { BasketProduct } from "../basketProduct";
import {
  IBasketProduct,
  ICurrency,
  IInvoice,
  IPromotion,
  type IBasket,
} from "@upmind-automation/types";
import { QueryResponseError } from "../query";
import { BasketContext } from "./types";
import { Product } from "../product";

// -----------------------------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(basketMachine, { devTools: true });

// -----------------------------------------------------------------------------

export const useBasket = () => {
  const { includesTax } = useBrand();
  const { meta: sessionMeta } = useSession();
  if (service.status == InterpreterStatus.NotStarted) service.start();
  const { state, send } = useActor(service);

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => stateMatches(state, ["shopping", "error"]),
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      return true;
    });
  }

  const meta = computed(() => {
    return {
      isLoading: stateMatches(state, ["subscribing", "loading"]), //

      isProcessing:
        stateMatches(state, ["shopping.refreshing.processing"]) ||
        machineMatches(actors.currency, ["processing"]) ||
        machineMatches(actors.customFields, ["processing"]) ||
        machineMatches(actors.billing, [
          "processing",
          "available.processing",
        ]) ||
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
          "checkout.available",
        ]) && contextMatches(state, ["products"]),

      needsAuth: !sessionMeta.value?.isAuthenticated,

      // ---
      hasProducts: contextMatches(state, ["products"]),

      hasInvalidProducts: some(
        contextValue<BasketProduct[]>(state, "products", []),
        "product.meta.invalid"
      ),

      hasTaxes: contextMatches(state, ["basket.taxes"]),

      hasPromotions: machineMatches(actors.promotions, ["complete"]),

      hasBillingDetails: machineMatches(actors.billing, ["complete"]),

      hasCurrency: machineMatches(actors.currency, ["complete"]),

      hasPaymentDetails: machineMatches(actors.paymentDetails, [
        "complete",
        "available.valid",
        "available.processing",
      ]),

      hasFields: machineMatches(actors.customFields, ["complete"]),

      hasAccount: stateMatches(state, [
        "shopping.account.complete",
        "checkout",
        "converting",
        "paying",
      ]),

      hasTaxIncluded: includesTax.value,

      // ---
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
          "shopping.paymentDetails.available",
        ],
        true
      ),

      isCheckout:
        machineMatches(payment, ["approving"]) ||
        stateMatches(state, ["checkout", "converting", "paying"]),

      isProcessingDetails:
        machineMatches(payment, ["approving"]) ||
        stateMatches(state, ["shopping.paymentDetails.processing"]),
      isConverting: stateMatches(state, ["converting"]),
      isPaying: stateMatches(state, ["paying"]),
      needsApproval: machineMatches(payment, ["approving"]),
      isComplete: stateMatches(state, ["complete", "failed"]),
      hasPaid: stateMatches(state, ["complete"]),
      hasFailed: stateMatches(state, ["failed"]),
      hasError: contextMatches(state, ["error"]),
    };
  });

  // --- Actors
  // We can create reactive actors to the child machines,
  // so that when they are invoked we can listen to their state changes
  const actors: {
    customFields: ComputedRef<Actor | undefined>;
    paymentDetails: ComputedRef<Actor | undefined>;
    billing: ComputedRef<Actor | undefined>;
    currency: ComputedRef<Actor | undefined>;
    promotions: ComputedRef<Actor | undefined>;
  } = {
    customFields: useContextActor(state, "actors.customFields"),
    paymentDetails: useContextActor(state, "actors.paymentDetails"),
    billing: useContextActor(state, "actors.billing"),
    currency: useContextActor(state, "actors.currency"),
    promotions: useContextActor(state, "actors.promotions"),
  };

  const payment = useChildActor(state, "payment");

  // --- context

  const basket = useContext<BasketContext["basket"]>(state, "basket");
  const basketId = useContext<IBasket["id"]>(state, "basket.id");
  const context = useContext<BasketContext>(state);
  const currency = useContext<ICurrency>(state, "basket.currency");
  const errors = useContext<QueryResponseError>(state, "error");
  const invoice = useContext<IInvoice>(state, "invoice");
  const products = useContext<IBasketProduct[]>(state, "products", []);
  // productsInvalid: computed(() => filter( products.value, product => !isEmpty(product?.errors))),
  const summary = useContext<BasketContext["summary"]>(state, "summary");
  const promotions = useContext<IPromotion[]>(state, "basket.promotions", []);
  const promotionCodes = computed(
    () => map(promotions.value, "promotion.code") as IPromotion["code"][]
  );
  const taxes = useContext<IBasket["taxes"]>(state, "basket.taxes", []);

  // --- methods

  function clear() {
    return send({ type: "CLEAR" });
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

  async function setCurrency(currency: string) {
    return waitFor(service, state => stateMatches(state, ["shopping"]), {
      timeout: 60_000,
    }).then(async () => {
      const actor = actors.currency;
      if (!actor.value)
        return Promise.reject(
          new DetailedError(
            "[headless] setCurrency on basket failed",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { state: state.value.value }
          )
        );

      const code = currency?.toUpperCase();
      // Use contextValue or a similar utility to get the model from the actor's state
      const value = contextValue<any>(actor, "model") || {};

      // if it has not then bail
      if (!code || code == value?.code) return Promise.resolve();

      actor.value?.send({ type: "SET", data: { code }, update: true });

      // then wait for the paymentGateway actor to be updated
      return waitFor(
        service as ActorRef<any>,
        state => {
          return stateMatches(state, [
            "processed",
            "complete",
            "error",
            "invalid",
          ]);
        },
        { timeout: 60_000 }
      )
        .then(state => {
          if (stateMatches(state, ["error", "invalid"])) {
            return Promise.reject(contextValue(state, "error"));
          }
          return Promise.resolve();
        })
        .catch(() => {
          throw new DetailedError(
            "[headless] setCurrency on basket timed out",
            responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              state: state.value.value,
            }
          );
        });
    });
  }

  async function addPromotion(coupon: string) {
    return waitFor(service, state => stateMatches(state, ["shopping"]), {
      timeout: 60_000,
    }).then(async () => {
      const actor = actors.promotions;

      if (!actor.value)
        return Promise.reject(
          new DetailedError(
            "[headless] addPromotion on basket failed",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { state: state.value.value }
          )
        );

      if (coupon) {
        actor.value?.send({ type: "SET", data: { promocode: coupon } });
        await waitFor(service as ActorRef<any>, state =>
          stateMatches(state, ["valid", "error"])
        )
          .then(state => {
            if (stateMatches(state, ["error"]))
              throw contextValue(state, "error");
          })
          .catch(error => {
            return Promise.reject(
              new DetailedError(
                "[headless] addPromotion on basket failed",
                responseCodes.Timeout,
                ErrorOrigin.Headless,
                {
                  error,
                  state: state.value.value,
                }
              )
            );
          });
      }

      actor.value?.send({ type: "ADD" });

      // then wait for the paymentGateway actor to be updated
      return waitFor(
        service as ActorRef<any>,
        state => {
          return stateMatches(state, ["processed", "complete", "error"]);
        },
        { timeout: 60_000 }
      ).then(state => {
        if (stateMatches(state, ["error"])) {
          return Promise.reject(
            new DetailedError(
              "[headless] addPromotion on basket failed",
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

  function productExists(mapping: Record<string, any>) {
    const cleanedMapping = compactDeep(mapping);
    const products = getProducts();

    return some(products, basketProduct =>
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
            "[headless] Basket item not found",
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
     * Meta information about the basket state.
     * @typedef {Object} BasketMeta
     * @property {boolean} isLoading - Indicates if the basket is currently loading.
     * @property {boolean} isProcessing - Indicates if the basket or any submodule is processing.
     * @property {boolean} isDirty - Indicates  that one of the submodules has been changed and the basket needs to be saved.
     * @property {boolean} isAvailable - Indicates if the basket is available for operations.
     * @property {boolean} needsAuth - Indicates if authentication is required for the basket.
     * @property {boolean} hasProducts - Indicates if the basket has products.
     * @property {boolean} hasInvalidProducts - Indicates if the basket has invalid products.
     * @property {boolean} hasTaxes - Indicates if the basket has taxes.
     * @property {boolean} hasPromotions - Indicates if the basket has promotions applied.
     * @property {boolean} hasBillingDetails - Indicates if the basket has billing details.
     * @property {boolean} hasCurrency - Indicates if the basket has a currency set.
     * @property {boolean} hasPaymentDetails - Indicates if the basket has payment details.
     * @property {boolean} hasFields - Indicates if the basket has custom fields.
     * @property {boolean} hasAccount - Indicates if the basket has an account associated.
     * @property {boolean} hasTaxIncluded - Indicates if tax is included in the basket.
     * @property {boolean} isReadyForCheckout - Indicates if the basket is ready for checkout.
     * @property {boolean} isCheckout - Indicates if the basket is in the checkout process.
     * @property {boolean} isProcessingDetails - Indicates if payment details are processing.
     * @property {boolean} isConverting - Indicates if the basket is converting.
     * @property {boolean} isPaying - Indicates if the basket is in the paying state.
     * @property {boolean} needsApproval - Indicates if the basket needs approval.
     * @property {boolean} isComplete - Indicates if the basket is complete.
     * @property {boolean} hasPaid - Indicates if the basket has been paid.
     * @property {boolean} hasFailed - Indicates if the basket has failed.
     * @property {boolean} hasError - Indicates if the basket has an error.
     */
    meta,

    // --- context

    /**
     * Child machine actors for basket submodules (customFields, paymentDetails, etc).
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
     * Checks if a product exists in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @returns {boolean} True if the product exists, false otherwise.
     */
    productExists,

    /**
     * Gets a product actor by basket product ID.
     * @param {string} bpid The basket product ID.
     * @returns {Promise<ActorRef<any>>} The product actor.
     */
    getProduct,
  };
};

export type UseBasket = ReturnType<typeof useBasket>;
