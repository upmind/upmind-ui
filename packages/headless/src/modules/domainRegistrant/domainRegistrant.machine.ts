// --- external
import { createMachine, assign, pure, spawn, sendTo } from "xstate";

// --- internal
import { basketSubscription } from "../basketProduct/helper";
import services from "./services";

// --- utils
import { mapToHeadlessError } from "../../utils";
import { isDomainProduct } from "../domain/utils";
import { parseBasketProduct } from "../basketProduct/utils";
import { every, has, isEmpty, isObject, reduce, set } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { IBasketProduct } from "@upmind-automation/types";
import type { ResponseError } from "../../utils";
import type { DomainRegistrantContext } from "./types";
import type { BasketProduct } from "../basketProduct/types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/domainRegistrant.machine
 * @description XState machine acting as a conduit for domain registrant data.
 * Coordinates between billing details and basket product provision fields.
 * Does NOT generate forms or fetch provision fields - delegates to existing
 * basket product infrastructure.
 *
 * Key concepts:
 * - `model`: Selected product IDs (from checkboxes)
 * - `lookups.basketProducts`: Domain products from basket
 * - Machine is a conduit - basketProduct is source of truth for actual data
 */

// -----------------------------------------------------------------------------

export default createMachine(
  {
    id: "domainRegistrantManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DomainRegistrantContext,
    states: {
      // Wait for basket subscription to send REFRESH with products
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "loadBasket"],
        on: {
          REFRESH: {
            target: "loading",
            actions: ["setBasketProducts", "resetModel"]
          },
          ERROR: {
            target: "unavailable",
            actions: ["setError"]
          }
        }
      },

      // Check if we have domain products and route accordingly
      loading: {
        always: [
          { target: "complete", cond: "allDomainsComplete" },
          { target: "available", cond: "hasDomainProducts" },
          { target: "unavailable" }
        ]
      },

      // Ready for user interaction
      available: {
        id: "available",
        initial: "idle",
        states: {
          idle: {
            always: [
              { target: "#unavailable", cond: "noDomainProducts" },
              { target: "#complete", cond: "allDomainsComplete" }
            ]
          },
          processing: {
            invoke: {
              src: "applyToBasket",
              onDone: {
                target: "idle"
              },
              onError: {
                target: "idle",
                actions: ["setError"]
              }
            }
          }
        },
        on: {
          // Basket updates
          REFRESH: {
            target: ".idle",
            actions: ["setBasketProducts", "resetModel"]
          },
          // Selection (checkboxes)
          SET: {
            actions: ["setSelectedProducts"]
          },
          // Apply billing to selected products
          APPLY_BILLING: {
            target: ".processing",
            actions: [
              () => {
                debugger;
              },
              "overrideModel"
            ]
          },
          // Apply provision fields to selected products (from inline edit)
          APPLY_PROVISION: {
            target: ".processing",
            actions: ["overrideModel"]
          }
        }
      },

      // No domain products in basket
      unavailable: {
        id: "unavailable"
      },

      // All domains valid - still listening for basket changes
      complete: {
        id: "complete"
      }
    },
    on: {
      REFRESH: {
        target: "loading",
        actions: ["setBasketProducts", "resetModel"]
      }
    }
  },
  {
    actions: {
      // --- context setup
      setContext: assign((_context: DomainRegistrantContext) => ({})),

      clearLookups: assign({
        lookups: () => ({ basketProducts: [] as BasketProduct[] }),
        model: () => [] as string[],
        error: () => undefined,
        authHelper: () => undefined,
        basketHelper: () => undefined,
        parseBasketProduct: () => undefined
      }),

      // --- helpers

      setBasketHelper: assign(({ basketHelper }: DomainRegistrantContext) => {
        // only do this once, set up the basket helper
        return {
          basketHelper: basketHelper ?? spawn(basketSubscription),

          parseBasketProduct: (
            raw: IBasketProduct
          ): BasketProduct | undefined => {
            // First check if we have the blueprint code available that identifies domain products
            // This is not always present as it requites a 'with' when fetching the basket
            // and the basket returned after an update may not have it
            // The fallback is to check if we have and SLD provision field
            // OR we can parse the service identifier as a domain

            if (
              !isDomainProduct({
                blueprintCode:
                  raw?.product?.provision_blueprint?.category?.code,
                provisionFields: raw?.provision_fields,
                serviceIdentifier: raw?.service_identifier ?? undefined
              })
            )
              return undefined;

            const basketProduct = parseBasketProduct(raw);

            return basketProduct;
          }
        };
      }),

      loadBasket: pure(({ basketHelper }: DomainRegistrantContext) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, { type: "INIT" });
      }),

      // --- basket sync
      setBasketProducts: assign(
        (
          { lookups, parseBasketProduct }: DomainRegistrantContext,
          { data }: AnyEventObject
        ) => {
          if (!isObject(data) || !has(data, "products")) return {};

          const domainProducts: BasketProduct[] = reduce(
            data?.products,
            (acc: BasketProduct[], basketProduct: IBasketProduct) => {
              const parsed = parseBasketProduct(basketProduct);
              if (parsed) acc.push(parsed);
              return acc;
            },
            []
          );

          set(lookups, "basketProducts", domainProducts);

          return { lookups };
        }
      ),

      resetModel: assign({
        model: ({ lookups }: DomainRegistrantContext) =>
          reduce(
            lookups.basketProducts,
            (acc: string[], p: BasketProduct) => {
              if (p.meta?.invalid || isEmpty(p.configuration.provisionFields)) {
                acc.push(p.id);
              }
              return acc;
            },
            []
          )
      }),

      // --- selection
      setSelectedProducts: assign({
        model: (_context: DomainRegistrantContext, { data }: AnyEventObject) =>
          (data as string[]) ?? []
      }),

      // Override model if bpids provided in event data
      overrideModel: assign({
        model: (
          { model }: DomainRegistrantContext,
          { data }: AnyEventObject
        ) => {
          debugger;
          return data?.bpids || model;
        }
      }),

      // --- error
      setError: assign({
        error: (_context: DomainRegistrantContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data) as ResponseError
      })
    },
    guards: {
      hasDomainProducts: ({ lookups }: DomainRegistrantContext) =>
        !isEmpty(lookups.basketProducts),
      noDomainProducts: ({ lookups }: DomainRegistrantContext) =>
        isEmpty(lookups.basketProducts),
      allDomainsComplete: ({ lookups }: DomainRegistrantContext) =>
        !isEmpty(lookups.basketProducts) &&
        every(
          lookups.basketProducts,
          bp => !bp.meta?.invalid || isEmpty(bp.configuration.provisionFields)
        )
    },
    services
  }
);
