import { computed, shallowRef } from "vue";
import { isActor } from "xstate/lib/Actor";
import { waitFor } from "xstate/lib/waitFor";
import { useBasket } from "../basket";
import { useI18n } from "../system-localisation";
import basketProductServices from "./basket-product.services";
import { useBasketProductPending } from "./useBasketProductPending";
import {
  DetailedError,
  ErrorOrigin,
  stateMatches,
  stopService,
  useSessionStorage
} from "../../utils";
import { responseCodes, compactDeep } from "../../utils";
import {
  defaults,
  defaultsDeep,
  find,
  forEach,
  get,
  isEmpty,
  isEqual,
  isNil,
  isString,
  keys,
  last,
  omit,
  omitBy,
  set,
  unset
} from "lodash-es";
import type { ProductModel, ProductProps } from "../product";
import type { IBasket } from "@upmind-automation/types";
import type { ActorRef, State, Subscription } from "xstate";

type PendingProduct = ReturnType<typeof useBasketProductPending>;

export type UseBasketProductPending = ReturnType<
  typeof useBasketProductPending
>;
// -----------------------------------------------------------------------------
// --- Singletons

let productConfigs: Record<ProductProps["productId"], ProductModel> = {};
// Reactive registry of pending product machines, keyed by the model-hash id.
// Presence of a machine for a given productId is the source of truth for
// `meta.isProcessing(pid)` — no separate processing flag needed.
const productsPending = shallowRef<
  Record<ProductProps["productId"], UseBasketProductPending>
>({});
const subscriptions: Record<ProductProps["productId"], Subscription> = {}; // store subscriptions to changes on the product

// -----------------------------------------------------------------------------

/**
 * Provides functionalities to manage products that are being configured and are pending addition to the basket.
 * This composable handles the lifecycle of pending products, including their addition, resolution,
 * and integration with the main basket state.
 *
 * @returns The API for managing pending basket products.
 */
export const useBasketProductsPending = () => {
  const { t } = useI18n();
  const { isReady, productExists, basketId, products } = useBasket();
  const storage = useSessionStorage();

  productConfigs = storage.get("pendingProducts", {});

  // ---

  /**
   * Adds a product configuration to the pending state.
   * If the exact configuration already exists, it returns the existing instance.
   * Otherwise, it creates a new instance using `useBasketProductPending`.
   *
   * @param model - The {@link ProductProps} defining the product and its configuration.
   * @returns A promise resolving to the {@link UseBasketProductPending} instance for the product.
   * @throws {DetailedError} If the provided model is empty or the product is unavailable.
   */
  function add(model: ProductProps): UseBasketProductPending {
    if (isEmpty(model))
      throw new DetailedError(
        t("error.product_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    const id = btoa(JSON.stringify(model)); // use the model as the basis for the id

    // if we have an item with the exact same configuration, then we can skip adding it
    const productPending = find(productsPending.value, ["id", id]);

    if (productPending) return productPending; // its allready added, so we can skip it

    const instance = useBasketProductPending(model);
    productsPending.value = {
      ...productsPending.value,
      [instance.id]: instance
    };
    return instance;
  }

  /**
   * Automatically adds and attempts to update a product configuration to the basket.
   * This does not spawn or validate a configuration  but rather tries to add the product directly and allow the BE to handle it.
   * This is to be used only for background updates where the user is not directly interacting with the product configuration.
   * eg: adding domains, autoadding products when loading the basket, etc.
   * @param model
   * @returns
   */
  async function addUpdate(pid: ProductProps["productId"]): Promise<IBasket> {
    if (isEmpty(pid))
      throw new DetailedError(
        t("error.product_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );

    await isReady();

    const model = defaultsDeep(get(productConfigs, pid, {}), {
      productId: pid,
      quantity: 1,
      silent: true
    }) as ProductProps;

    return basketProductServices.update(basketId.value!, model);
  }

  /**
   * Ensures a product configuration exists and is ready. If it doesn't exist or `force` is true,
   * it adds the product. It then waits for the product's service to become available or error.
   *
   * @param pid - The product ID for which to ensure the configuration.
   * @param model - The {@link ProductProps} defining the product and its configuration.
   * @param force - If `true`, re-adds the product even if it already exists.
   * @returns A promise resolving to the {@link UseBasketProductPending} instance.
   * @throws {DetailedError} If the product cannot be added, validated, or found.
   */
  async function ensure(
    pid: ProductProps["productId"],
    model: ProductProps,
    force: boolean = false
  ): Promise<UseBasketProductPending> {
    // ensure we wait for the basket to be ready
    await isReady();

    const product = find(
      productsPending.value,
      ({ model, meta }) =>
        model.value?.productId === pid && !meta.value?.isComplete
    );
    if (isEmpty(product) || force) {
      const instance = add(model);
      return waitFor(
        instance.service,
        state =>
          stateMatches(state, ["available", "unavailable", "complete", "done"]),
        { timeout: Infinity }
      ).then(state => {
        if (stateMatches(state, ["unavailable", "complete", "done"])) {
          // Clean up the pending entry so a terminal-on-arrival state doesn't
          // leak into `productsPending` and keep `meta.isProcessing()` true.
          if (stateMatches(state, ["complete", "done"])) {
            resolve(pid);
          } else {
            unsetProduct(pid);
          }
          throw new DetailedError(
            t("error.product_pending_add_failed"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { state: state.value, errors: state.context.error }
          );
        }
        return instance;
      });
    } else {
      return product;
    }
  }

  /**
   * Subscribes to the state changes of a product's XState service.
   * This allows for side effects based on the product's lifecycle, e.g.,
   * resetting state on error or resolving on completion.
   *
   * @param pid - The product ID to subscribe to.
   * @param actor - The `ActorRef` of the product's XState service.
   */
  async function subscribe(
    pid: ProductProps["productId"],
    actor: ActorRef<any>
  ) {
    if (get(subscriptions, pid)) return; // already subscribed

    if (stateMatches(actor, ["done", "complete"])) return; // don't subscribe to stopped services

    waitFor(
      actor,
      state =>
        stateMatches(state, ["available", "unavailable", "complete", "done"]),
      { timeout: Infinity }
    )
      .then(state => {
        // NB dont subscribeif we are already in a terminal state
        if (stateMatches(state, ["unavailable", "done", "complete"])) return;

        const subscription = actor.subscribe((state: State<any>) => {
          if (stateMatches(state, ["unavailable"])) {
            unsetProduct(pid);
          } else if (stateMatches(state, "available")) {
            setProduct(pid, get(state, "context.model"));
          } else if (stateMatches(state, ["complete", "done"])) {
            resolve(pid);
          }
        });
        set(subscriptions, pid, subscription);
      })
      .catch(() => {
        return;
      });
  }

  // ---

  /**
   * Checks if a product with the given ID and model configuration exists in the pending products.
   *
   * @param pid - The product ID to check for.
   * @returns `true` if the product exists in pending configurations, `false` otherwise.
   */
  function exists(pid: ProductProps["productId"]): boolean {
    const model = get(productConfigs, pid);
    return !isEmpty(model);
  }

  /**
   * Retrieves a pending product instance by its product ID.
   * It first checks for existing pending products, otherwise it attempts to ensure
   * the product by adding it if necessary. Optionally synchronises the subscription.
   *
   * @param pid - The product ID to retrieve. If omitted, defaults to the last key in `productConfigs`.
   * @param sync - If `true`, subscribes to the product's state changes.
   * @param force - If `true`, forces a re-addition of the product even if it exists.
   * @returns A promise resolving to the {@link UseBasketProductPending} instance.
   * @throws {DetailedError} If the product ID is not found or if ensuring the product fails.
   */
  async function getProduct(
    pid?: ProductProps["productId"],
    {
      sync,
      force,
      silent
    }: {
      sync?: boolean;
      force?: boolean;
      silent?: boolean;
    } = {}
  ): Promise<UseBasketProductPending> {
    const productId = pid || last(keys(productConfigs));
    if (!productId) {
      throw new DetailedError(
        t("error.product_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless,
        {
          message: t("error.product_not_available"),
          code: responseCodes.Not_Found
        }
      );
    }

    const model = get(productConfigs, productId, {
      productId,
      quantity: 1
    }) as ProductProps;

    // pass through silent option to the product model
    model.silent = silent;

    return ensure(productId, model, force)
      .then(instance => {
        if (sync) subscribe(productId, instance.service);
        return instance;
      })
      .catch(error => {
        throw new DetailedError(
          t("error.product_pending_ensure_failed"),
          responseCodes.No_Content,
          ErrorOrigin.Headless,
          { error, productId }
        );
      });
  }

  /**
   * Sets or updates the product configuration in the pending products cache and session storage.
   *
   * @param pid - The product ID to set the configuration for.
   * @param value - The {@link ProductModel} or {@link State} object containing the new configuration.
   */
  function setProduct(
    pid: ProductProps["productId"],
    value?: ProductModel | State<any>
  ) {
    const safeValue = omit(value, "id");

    const model = defaults(safeValue, { productId: pid });

    set(productConfigs, pid, model);
    storage.set("pendingProducts", productConfigs);
  }

  /**
   * Tears down the pending product's actor: unsubscribes, stops the service,
   * and removes it from `productsPending`.
   *
   * @param pid - The product ID to unset.
   */
  function unsetProduct(pid: ProductProps["productId"]) {
    const product = find(
      productsPending.value,
      ({ model }) => model.value?.productId === pid
    ) as UseBasketProductPending;
    // ensure we unsubscribe from the item if it exists
    const sub = get(subscriptions, pid);
    if (sub?.unsubscribe) {
      sub?.unsubscribe();
      unset(subscriptions, pid);
    }
    // stop the product if it exists and remove it from the pending products
    if (product?.service) {
      stopService(product.service);
      productsPending.value = omit(productsPending.value, product.id);
    }
  }

  /**
   * Resolves a pending product, typically after it has been successfully added to the basket.
   * This removes the product from pending configurations, storage, and unsubscribes from its service.
   * It also cleans up any completed products from the pending list.
   *
   * @param target - The product ID or `ActorRef` to resolve. If `null` or `undefined`, it resolves all completed products.
   */
  function resolve(target?: ProductProps["productId"] | ActorRef<any>) {
    const pid = isString(target)
      ? target
      : get(productsPending.value, target!.id)?.model?.value?.productId;

    if (pid) {
      unsetProduct(pid);
      // as we have successfully added our config we can remove it from storage
      unset(productConfigs, pid);
      storage.set("pendingProducts", productConfigs);
    }

    // NB ensure any complete products are removed from the pending products
    productsPending.value = omitBy(
      productsPending.value,
      ({ meta }) => meta.value?.isComplete
    );
  }

  /**
   * Adds multiple product configurations to the pending list.
   * It iterates through the provided configurations and calls `setProduct` for each.
   *
   * @param configs - An optional array of {@link ProductModel} configurations to add.
   */
  function addMany(configs?: ProductModel[]): void {
    // ensure we add all our configs to the productConfigs
    forEach(configs, config => setProduct(config.productId, config));
  }

  /**
   * Clears all pending product configurations from the cache, storage, and stops their services.
   * This effectively resets the pending products state.
   */
  function clear() {
    forEach(productConfigs, (_model, pid) => unsetProduct(pid));
    productConfigs = {};
    storage.clear();
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Checks if the basket service is ready.
     * @returns A promise resolving to `true` if pending products have been loaded from storage.
     */
    isReady: () => new Promise(resolve => resolve(!isNil(productConfigs))),

    /**
     * Meta-information about the pending products state.
     * @property {boolean} hasProducts - `true` if there are any pending products.
     * @property {function(pid?: string): boolean} isProcessing - A function that returns `true` if any pending product (or a specific `pid`) is currently being added/updated to the basket.
     * @property {function(pid?: string): boolean} isInBasket - A function that returns `true` if the given `pid` is currently in the basket (or, with no `pid`, if the basket has any products).
     */
    meta: computed(() => ({
      hasProducts: !isEmpty(products.value),
      isProcessing: (pid?: ProductProps["productId"]) =>
        pid
          ? !!find(
              productsPending.value,
              ({ model }) => model.value?.productId === pid
            )
          : !isEmpty(productsPending.value),
      isInBasket: (pid?: ProductProps["productId"]) =>
        pid ? !!productExists({ productId: pid }) : !isEmpty(products.value)
    })),

    /**
     * Configures and returns a composable for a specific pending product, identified by its ID or configuration.
     * It either retrieves an existing pending product instance or creates a new one.
     *
     * @param pid - The product ID or an ActorRef to an existing product machine. If omitted, it defaults to the last product pending.
     * @param sync - If `true`, subscribes to the product's state changes.
     * @returns A promise resolving to the {@link UseBasketProductPending} instance for the product.
     * @throws {DetailedError} If the product is not available or cannot be configured.
     */
    configure: async (
      pid?: ProductProps["productId"] | ActorRef<any>,
      sync?: boolean
    ): Promise<PendingProduct> => {
      const instance = isActor(pid)
        ? useBasketProductPending(pid as ActorRef<any>)
        : await getProduct(pid as ProductProps["productId"], { sync });

      if (isEmpty(instance)) {
        throw new DetailedError(
          t("error.product_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      return Promise.resolve(instance);
    },

    /**
     * Checks if a product with the given configuration already exists in the pending products list or the main basket.
     * This prevents duplicate pending entries and redundant operations.
     *
     * @param config - Partial {@link ProductProps} to check for existence.
     * @returns A promise resolving to `true` if the product exists in pending or basket, `false` otherwise.
     */
    isInBasket: async (config: Partial<ProductProps>) => {
      const cleanConfig = compactDeep(config);
      const keysModel = keys(cleanConfig);
      const hasConfig = !isEqual(keysModel, ["productId", "quantity"]);
      // bail early if we have no config other than productId and quantity
      if (!hasConfig) return false;
      await isReady();
      return productExists(config);
    },
    //  --- context

    /**
     * The reactive list of all products currently in the shopping basket.
     */
    products,

    /**
     * Reactive record of all pending product machines, keyed by model-hash id.
     */
    productsPending,

    /**
     * Resolves a pending product, removing it from pending state and storage after it's processed or added to the basket.
     */
    resolve,

    /**
     * Adds multiple product configurations to the pending list, persisting them.
     * @param configs - An optional array of {@link ProductModel} configurations to add.
     */
    addMany,

    /**
     * Clears all pending product configurations from cache, storage, and stops their services.
     */
    clear,

    /**
     * Checks if a product configuration exists in the pending list.
     * @param pid - The product ID to check.
     * @returns `true` if the product configuration exists, `false` otherwise.
     */
    exists,

    /**
     * Adds a product configuration to the pending state or ensures it exists.
     * This is a debounced version of the `ensure` function.
     * @param model - The {@link ProductProps} defining the product and its configuration.
     * @returns A promise resolving to the {@link UseBasketProductPending} instance.
     */
    add: ensure,

    /**
     * Automatically adds and attempts to update a product configuration to the basket.
     * This does not spawn or validate a configuration  but rather tries to add the product directly and allow the BE to handle it.
     * This is to be used only for background updates where the user is not directly interacting with the product configuration.
     * eg: adding domains, autoadding products when loading the basket, etc.
     * @param model - The {@link ProductProps} defining the product and its configuration.
     * @returns A promise resolving to the {@link UseBasketProductPending} instance.
     */
    addUpdate,

    /**
     * Retrieves a pending product instance by its product ID.
     * Optionally synchronises with its state changes.
     * @param pid - The product ID. If omitted, defaults to the last product pending.
     * @param sync - If `true`, subscribes to the product's state changes.
     * @returns A promise resolving to the {@link UseBasketProductPending} instance.
     */
    get: getProduct,

    /**
     * Removes a pending product configuration. This operation is debounced.
     * @param pid - The product ID to remove.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    remove: unsetProduct
  };
};
