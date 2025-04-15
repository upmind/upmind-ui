// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBasket } from "../basket";
import { useBasketProductPending } from "./useBasketProductPending";

// --- utils
import { useSessionStorage } from "../../utils";
import {
  defaults,
  find,
  first,
  forEach,
  get,
  set,
  unset,
  isEmpty,
  keys,
  map,
  omit,
  isString,
  isNil,
} from "lodash-es";

// --- types
import type { ActorRef, State, Subscription } from "xstate";
import type { ProductModel } from "../product";
import { responseCodes } from "../../utils";

type BasketProductPending = ReturnType<typeof useBasketProductPending>;
// -----------------------------------------------------------------------------
// --- Singletons

let productConfigs: Record<string, ProductModel> = {};
let productsPending: Record<string, BasketProductPending> = {}; // store the product productsPending
let subscriptions: Record<string, Subscription> = {}; // store subscriptions to changes on the product

// -----------------------------------------------------------------------------

export const useBasketProductsPending = () => {
  const { isReady, getBasket } = useBasket();
  const storage = useSessionStorage();

  productConfigs = storage.get("pendingProducts", {});

  // ---

  async function add(model: ProductModel): Promise<BasketProductPending> {
    if (isEmpty(model)) return Promise.reject("No product model found");

    const id = btoa(JSON.stringify(model)); // use the model as the basis for the id

    // if we have an item with the exact same configuration, then we can skip adding it
    const productPending = find(productsPending, ["id", id]);

    if (productPending) return Promise.resolve(productPending); // its allready added, so we can skip it

    return isReady().then(async () => {
      // then wait/check for the new product actor to be configured
      // then send the update event to the basket
      return useBasketProductPending(model);
    });
  }

  async function ensure(
    pid: string,
    model: ProductModel,
    force: boolean = false
  ): Promise<BasketProductPending> {
    const product = find(productsPending, service => {
      const state = service.getSnapshot();
      return get(state, "context.model.productId") === pid;
    });

    if (isEmpty(product) || force) {
      return add(model)
        .then(async instance => {
          set(productsPending, instance.id, instance);
          return waitFor(
            instance.service,
            state =>
              !["loading", "subscribing", "processing", "refreshing"].some(
                state.matches
              ),
            { timeout: Infinity }
          ).then(state => {
            if (state.matches("error")) throw new Error(state.context.error);
            return instance;
          });
        })
        .catch(error => {
          unsetProduct(pid);
          return Promise.reject(error);
        });
    } else {
      if (!product.getSnapshot().matches("error")) {
        return Promise.resolve(product);
      } else {
        const error = get(product.getSnapshot(), "context.error");
        unsetProduct(pid);
        return Promise.reject({
          message: error,
          code: responseCodes.Unprocessable_Entity,
        });
      }
    }
  }

  function subscribe(pid: string, actor: ActorRef<any>) {
    const subscription = actor.subscribe((state: State<any>) => {
      if (state.matches("error")) {
        unsetProduct(pid);
      } else if (state.matches("available")) {
        setProduct(pid, get(state, "context.model"));
      } else if (state.done) {
        unsetProduct(pid);
      } else {
        // should we resolve on complete?
        console.info("Product state", state.value);

        // resolve(actor);
      }
    });
    set(subscriptions, pid, subscription);
  }

  // ---

  async function getProduct(
    pid?: string,
    sync?: boolean
  ): Promise<BasketProductPending> {
    const productId = pid || first(keys(productConfigs));
    if (!productId) {
      return Promise.reject({
        message: "No product id found",
        code: responseCodes.Not_Found,
      });
    }
    const model = get(productConfigs, productId, { productId, quantity: 1 });
    return ensure(productId, model).then(instance => {
      if (sync) subscribe(productId, instance.service);
      return instance;
    });
  }

  function setProduct(productId: string, value?: ProductModel | State<any>) {
    const safeValue = omit(value, "id");

    const model = defaults(safeValue, { productId });

    set(productConfigs, productId, model);
    storage.set("pendingProducts", productConfigs);
  }

  function unsetProduct(pid: string) {
    const product = find(productsPending, service => {
      const state = service.getSnapshot();
      return get(state, "context.model.productId") === pid;
    });

    // ensure we unsubscribe from the item if it exists
    const sub = get(subscriptions, pid);
    sub?.unsubscribe();
    unset(subscriptions, pid);

    // stop the product if it exists and remove it from the pending products
    if (product?.service?.status == InterpreterStatus.Running) {
      product.stop();
      unset(productsPending, product.id);
    }

    // remove the product from the pending products storage
    unset(productConfigs, pid);
    storage.set("pendingProducts", productConfigs);
  }

  // resolve is called after successfully adding a product to the basket
  function resolve(product?: string | ActorRef<any>) {
    const target = isString(product)
      ? get(productsPending, product)
      : get(productsPending, product?.id ?? "");

    const pid = get(target, "state.context.model.productId");
    if (pid) unsetProduct(pid);
  }

  function addMany(configs?: ProductModel[]): void {
    // ensure we add all our configs to the productConfigs
    forEach(configs, config => setProduct(config.productId, config));
  }

  function clear() {
    forEach(productConfigs, (_model, pid) => unsetProduct(pid));
    storage.clear();
  }

  // ---------------------------------------------------------------------------

  return {
    getProducts: () => productsPending,
    isReady: () => new Promise(resolve => resolve(!isNil(productConfigs))),
    // ---
    add: ensure,
    get: getProduct,
    remove: unsetProduct,
    resolve,
    // --
    addMany,
    clear,
  };
};
