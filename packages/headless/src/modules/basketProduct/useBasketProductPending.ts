// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../product/product.machine";
import { useBasket } from "../basket";
import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { ParseDataLayerEcommerceItem } from "./utils";
import { parseQuantity } from "../product/utils";
import { DetailedError, responseCodes } from "../../utils";
import { isEmpty, get, add, subtract, find, omitBy, isNil } from "lodash-es";

// --- types

import type {
  ProductModel,
  ProductDetails,
  SummaryDetails,
  TermDetails,
} from "../product";
import { DataLayerEcommerceItem } from "../system/analytics/types";

// -----------------------------------------------------------------------------

export const useBasketProductPending = (model: ProductModel) => {
  const { getBasket } = useBasket();
  const rawBasket = getBasket();

  if (isEmpty(model) || isEmpty(model.productId))
    throw new DetailedError(
      "Product Model is empty or has no productId",
      responseCodes.Unprocessable_Entity
    );

  const id = btoa(JSON.stringify(model)); // use the model as the basis for the id

  let service = interpret(
    productMachine.withContext({
      id,
      basketId: rawBasket.id,
      clientId: rawBasket.client_id,
      currencyId: rawBasket.currency_id,
      promotions: rawBasket.promotions,
      coupons: model?.coupons ?? [],
      // ---
      model,
    }),
    {
      id,
      devTools: true,
    }
  ).start();

  // now that we have a product configation, we can push it to the datalayer
  pushSelectItem();

  // ---------------------------------------------------------------------------

  async function isReady(): Promise<void> {
    return waitFor(service, state => state.matches("available"), {
      timeout: Infinity, // infinity = no timeout
    }).then(() => {});
  }

  // refresh: async (newBasket: IBasket) => {
  //   service.send({ type: "REFRESH", rawBasket });
  //   return waitFor(service, state => state.matches("available"));
  // },

  async function getProduct(): Promise<ProductDetails> {
    return new Promise<ProductDetails>((resolve, reject) => {
      const product = get(service.getSnapshot(), "context.lookups.product") as
        | ProductDetails
        | undefined;
      // sanity check
      if (!product) return reject("Product not found");
      // ---
      return resolve(product);
    });
  }

  async function getTerm(): Promise<TermDetails> {
    return new Promise<TermDetails>((resolve, reject) => {
      const terms = get(service.getSnapshot(), "context.lookups.terms") as
        | TermDetails[]
        | undefined;

      const term = find(terms, ["cycle", model.term]) as TermDetails;
      // sanity check
      if (!term) return reject("Product Term not found");
      // ---
      return resolve(term);
    });
  }

  async function getSummary(): Promise<SummaryDetails> {
    return new Promise<SummaryDetails>((resolve, reject) => {
      const summary = get(service.getSnapshot(), "context.suummary") as
        | SummaryDetails
        | undefined;
      // sanity check
      if (!summary) return reject("Product Summary not found");
      // ---
      return resolve(summary);
    });
  }

  async function update(): Promise<void> {
    return waitFor(service, state =>
      ["available.valid"].some(state.matches)
    ).then(() => {
      service.send({ type: "UPDATE" });
      return waitFor(service, state => !state.matches("processing"), {
        timeout: Infinity,
      }).then(state => {
        if (["error", "available.error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    });
  }

  async function remove(): Promise<void> {
    service.send({ type: "REMOVE" });
    await waitFor(service, state => ["complete"].some(state.matches), {
      timeout: Infinity,
    });
  }

  // Add our Pending Product being configured to the datalayer
  async function pushSelectItem() {
    await isReady(); // NB wait for everything to finish loading
    const product = getProduct();
    const term = getTerm();

    Promise.all([product, term])
      .then(([product, term]) => {
        {
          const payload = ParseDataLayerEcommerceItem(model, product, term);
          dataLayer({ event: "select_item" }).withItems(payload).push();
        }
      })
      .catch(() => {
        // do notihng
        return;
      });
  }

  // ---------------------------------------------------------------------------
  return {
    id,
    service,
    getSnapshot: () => service?.getSnapshot(),
    stop: () => service.status == InterpreterStatus.Running && service.stop(),
    // ---
    isReady,
    // ---
    updateQuantity: async (value: number): Promise<void> =>
      getProduct().then(product => {
        if (!product?.quantifiable)
          return Promise.reject("Product not quantifiable");

        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(value, product),
          },
        });
        return update();
      }),

    incrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        const model = get(service.getSnapshot(), "context.model");
        const qty = add(get(model, "quantity", 1), product.step);
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product),
          },
        });
        return update();
      }),

    decrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        const model = get(service.getSnapshot(), "context.model");
        const qty = subtract(get(model, "quantity", 1), product.step);
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product),
          },
        });
        return update();
      }),

    update,
    remove,
  };
};
