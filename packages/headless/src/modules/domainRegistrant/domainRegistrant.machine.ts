// --- external
import { createMachine, assign, pure, spawn, sendTo } from "xstate";

// --- internal
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import services from "./services";

// --- utils
import { mapToHeadlessError } from "../../utils";
import {
  getDomainRawBasketProducts,
  isDomainProduct,
  parseDomain
} from "../domain/utils";
import { parseBasketProduct } from "../basketProduct/utils";
import {
  determineStatus,
  isProductComplete,
  mapBillingToProvisionFields
} from "./utils";
import {
  first,
  forEach,
  get,
  has,
  isEmpty,
  isObject,
  map,
  reduce,
  set,
  some
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { IBasketProduct } from "@upmind-automation/types";
import type { DomainProduct } from "../domain/types";
import type { ResponseError } from "../../utils";
import type {
  DomainRegistrantContext,
  DomainRegistrantProductState
} from "./types";
import { DOMAIN_REGISTRANT_PRODUCT_STATUS } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/domainRegistrant.machine
 * @description XState machine acting as a conduit for domain registrant data.
 * Coordinates between billing details and basket product provision fields.
 * Does NOT generate forms or fetch provision fields - delegates to existing
 * basket product infrastructure.
 */

// -----------------------------------------------------------------------------

export default createMachine(
  {
    id: "domainRegistrantManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      products: new Map(),
      lookups: { basket: [] },
      model: null,
      error: null,
      savingProductId: null
    } as DomainRegistrantContext,
    states: {
      // Wait for basket subscription to send REFRESH with products
      subscribing: {
        entry: [
          "setContext",
          "clearLookups",
          "setBasketHelper",
          "setAuthHelper",
          "loadBasket"
        ],
        on: {
          REFRESH: {
            target: "loading",
            actions: ["setBasketProducts", "syncProducts", "refreshContext"]
          },
          ERROR: {
            target: "unavailable",
            actions: ["setError"]
          }
        }
      },

      // Check if we have domain products
      loading: {
        always: [
          { target: "available", cond: "hasDomainProducts" },
          { target: "unavailable" }
        ]
      },

      available: {
        id: "available",
        initial: "idle",
        states: {
          idle: {},
          processing: {
            invoke: {
              src: "saveToBasket",
              onDone: {
                target: "idle",
                actions: ["updateProductStatus", "clearSavingProduct"]
              },
              onError: {
                target: "idle",
                actions: ["setError", "clearSavingProduct"]
              }
            }
          }
        },
        on: {
          // Basket updates
          REFRESH: {
            actions: ["setBasketProducts", "syncProducts", "refreshContext"]
          },
          // Billing source
          SET_BILLING: {
            actions: ["setBillingSource"]
          },
          APPLY_BILLING: {
            actions: ["applyBillingToProducts"]
          },
          // Per-product data
          SET: {
            actions: ["setProductData"]
          },
          SAVE: {
            target: ".processing",
            actions: ["setSavingProduct"]
          },
          SKIP: {
            actions: ["skipProduct"]
          },
          UNSKIP: {
            actions: ["unskipProduct"]
          }
        }
      },

      unavailable: {
        on: {
          REFRESH: {
            target: "available",
            actions: ["setBasketProducts", "syncProducts", "refreshContext"]
          }
        }
      },

      complete: {
        type: "final"
      }
    },
    on: {
      STOP: { target: "complete" },
      AUTHENTICATED: { target: "subscribing", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "subscribing", actions: ["clearLookups"] }
    }
  },
  {
    actions: {
      // --- context setup
      setContext: assign((_context: DomainRegistrantContext) => ({})),

      clearLookups: assign({
        lookups: () => ({ basket: [] as DomainProduct[] }),
        products: () => new Map<string, DomainRegistrantProductState>(),
        authHelper: () => undefined,
        basketHelper: () => undefined,
        parseBasketProduct: () => undefined
      }),

      refreshContext: assign(
        (_context: DomainRegistrantContext, { data }: AnyEventObject) => {
          if (isEmpty(data)) return {};
          const { id: basketId, brand_id: brandId, currency } = data;
          return { basketId, brandId, currency: currency?.code };
        }
      ),

      // --- helpers
      setAuthHelper: assign(({ authHelper }: DomainRegistrantContext) => ({
        authHelper: authHelper || spawn(authSubscription)
      })),

      setBasketHelper: assign(({ basketHelper }: DomainRegistrantContext) => ({
        basketHelper: basketHelper ?? spawn(basketSubscription),
        parseBasketProduct: (
          raw: IBasketProduct,
          primaryDomain?: string
        ): DomainProduct | undefined => {
          if (
            !isDomainProduct({
              serviceIdentifier: raw.service_identifier,
              blueprintCode: raw?.product?.provision_blueprint?.category?.code,
              provisionFields: raw?.provision_fields
            })
          )
            return undefined;

          const value = raw?.service_identifier;
          const parsed = value ? parseDomain(value) : undefined;
          if (!parsed) return undefined;

          const basketProduct = parseBasketProduct(raw) as DomainProduct;
          basketProduct.tld = parsed.tld;
          basketProduct.sld = parsed.sld;
          basketProduct.domain = parsed.domain;
          basketProduct.meta.selected = parsed.domain === primaryDomain;
          basketProduct.productDetails.title = parsed.domain;
          return basketProduct;
        }
      })),

      loadBasket: pure(({ basketHelper }: DomainRegistrantContext) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, { type: "INIT" });
      }),

      // --- basket sync
      setBasketProducts: assign({
        lookups: (
          { lookups, parseBasketProduct, model }: DomainRegistrantContext,
          { data }: AnyEventObject
        ) => {
          // Bail out if we have not been given a basket with products
          if (!isObject(data) || !has(data, "products")) return lookups;

          const primary = model || first(lookups.basket);

          const available = reduce(
            data.products,
            (result: DomainProduct[], raw: IBasketProduct) => {
              const parsed = parseBasketProduct?.(
                raw,
                (primary as DomainProduct)?.domain
              );
              if (parsed && !some(result, ["domain", parsed.domain])) {
                result.push(parsed);
              }
              return result;
            },
            []
          );

          set(lookups, "basket", available);
          return lookups;
        }
      }),

      // Sync products Map with basket - add new, remove stale
      syncProducts: assign({
        products: (
          { products }: DomainRegistrantContext,
          { data }: AnyEventObject
        ) => {
          // Bail out if we have not been given a basket with products
          if (!isObject(data) || !has(data, "products")) return products;

          const domains = getDomainRawBasketProducts(data.products);
          const currentIds = new Set(map(domains, "id"));
          const newProducts = new Map<string, DomainRegistrantProductState>();

          // Keep existing products that are still in basket
          products.forEach((state, id) => {
            if (currentIds.has(id)) {
              newProducts.set(id, state);
            }
          });

          // Add new products
          forEach(domains, (raw: IBasketProduct) => {
            const productId = raw.id;
            if (!productId || newProducts.has(productId)) return;

            const domain =
              raw.service_identifier ??
              get(raw, "provision_fields.sld", productId);

            newProducts.set(productId, {
              id: productId,
              domain,
              data: {},
              status: DOMAIN_REGISTRANT_PRODUCT_STATUS.INCOMPLETE
            });
          });

          return newProducts;
        }
      }),

      // --- billing source
      setBillingSource: assign({
        model: (_context: DomainRegistrantContext, event: AnyEventObject) =>
          event.data
      }),

      applyBillingToProducts: assign({
        products: (context: DomainRegistrantContext, event: AnyEventObject) => {
          const productIds = event.productIds as string[];
          const newProducts = new Map(context.products);

          if (!context.model) return newProducts;

          forEach(productIds, productId => {
            const productState = newProducts.get(productId);
            if (!productState) return;

            const mappedData = mapBillingToProvisionFields(context.model);
            const newData = { ...productState.data, ...mappedData };
            const status = determineStatus(newData, productState.status);

            newProducts.set(productId, {
              ...productState,
              data: newData,
              status
            });
          });

          return newProducts;
        }
      }),

      // --- data management
      setProductData: assign({
        products: (context: DomainRegistrantContext, event: AnyEventObject) => {
          const productId = event.productId as string;
          const data = event.data as Record<string, string>;
          const newProducts = new Map(context.products);
          const productState = newProducts.get(productId);

          if (productState) {
            const newData = { ...productState.data, ...data };
            const status = determineStatus(
              newData,
              DOMAIN_REGISTRANT_PRODUCT_STATUS.INCOMPLETE
            );
            newProducts.set(productId, {
              ...productState,
              data: newData,
              status
            });
          }

          return newProducts;
        }
      }),

      // --- saving
      setSavingProduct: assign({
        savingProductId: (
          _context: DomainRegistrantContext,
          event: AnyEventObject
        ) => event.productId as string
      }),

      clearSavingProduct: assign({
        savingProductId: () => null
      }),

      updateProductStatus: assign({
        products: (context: DomainRegistrantContext) => {
          if (!context.savingProductId) return context.products;

          const newProducts = new Map(context.products);
          const productState = newProducts.get(context.savingProductId);

          if (productState) {
            newProducts.set(context.savingProductId, {
              ...productState,
              status: DOMAIN_REGISTRANT_PRODUCT_STATUS.COMPLETE
            });
          }

          return newProducts;
        }
      }),

      // --- skip/unskip
      skipProduct: assign({
        products: (context: DomainRegistrantContext, event: AnyEventObject) => {
          const productId = event.productId as string;
          const newProducts = new Map(context.products);
          const productState = newProducts.get(productId);

          if (productState) {
            newProducts.set(productId, {
              ...productState,
              status: DOMAIN_REGISTRANT_PRODUCT_STATUS.SKIPPED
            });
          }

          return newProducts;
        }
      }),

      unskipProduct: assign({
        products: (context: DomainRegistrantContext, event: AnyEventObject) => {
          const productId = event.productId as string;
          const newProducts = new Map(context.products);
          const productState = newProducts.get(productId);

          if (productState) {
            const status = isProductComplete(productState.data)
              ? DOMAIN_REGISTRANT_PRODUCT_STATUS.COMPLETE
              : DOMAIN_REGISTRANT_PRODUCT_STATUS.INCOMPLETE;

            newProducts.set(productId, { ...productState, status });
          }

          return newProducts;
        }
      }),

      // --- error
      setError: assign({
        error: (_context: DomainRegistrantContext, event: AnyEventObject) =>
          mapToHeadlessError(event.data) as ResponseError
      })
    },
    guards: {
      hasDomainProducts: (context: DomainRegistrantContext) =>
        context.products.size > 0
    },
    services
  }
);
