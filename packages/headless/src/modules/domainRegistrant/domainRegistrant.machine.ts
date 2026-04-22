// --- external
import { createMachine, assign, pure, spawn, sendTo } from "xstate";

// --- internal
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import services from "./services";

// --- utils
import { mapToHeadlessError } from "../../utils";
import { isDomainProduct } from "../domain/utils";
import { parseBasketProduct } from "../basketProduct/utils";
import { has, isObject, reduce, set, some } from "lodash-es";

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
    context: {
      lookups: { basketProducts: [] },
      model: []
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
            actions: ["setBasketProducts"]
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

      // Ready for user interaction
      available: {
        id: "available",
        initial: "idle",
        states: {
          idle: {},
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
            actions: ["setBasketProducts"]
          },
          // Selection (checkboxes)
          SET: {
            actions: ["setSelectedProducts"]
          },
          // Apply billing to selected products
          APPLY_BILLING: {
            target: ".processing",
            actions: ["setModelOverride"]
          },
          // Apply provision fields to selected products (from inline edit)
          APPLY_PROVISION: {
            target: ".processing",
            actions: ["setModelOverride"]
          }
        }
      },

      // No domain products in basket
      unavailable: {
        on: {
          REFRESH: {
            target: "loading",
            actions: ["setBasketProducts"]
          }
        }
      },

      // Truly final - machine stopped
      stopped: {
        type: "final"
      }
    },
    on: {
      STOP: { target: "stopped" },
      AUTHENTICATED: { target: "subscribing", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "subscribing", actions: ["clearLookups"] }
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
      setAuthHelper: assign(({ authHelper }: DomainRegistrantContext) => ({
        authHelper: authHelper || spawn(authSubscription)
      })),

      setBasketHelper: assign(({ basketHelper }: DomainRegistrantContext) => ({
        basketHelper: basketHelper ?? spawn(basketSubscription),
        parseBasketProduct: (
          raw: IBasketProduct
        ): BasketProduct | undefined => {
          if (
            !isDomainProduct({
              serviceIdentifier: raw.service_identifier,
              blueprintCode: raw?.product?.provision_blueprint?.category?.code,
              provisionFields: raw?.provision_fields
            })
          )
            return undefined;

          return parseBasketProduct(raw);
        }
      })),

      loadBasket: pure(({ basketHelper }: DomainRegistrantContext) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, { type: "INIT" });
      }),

      // --- basket sync
      setBasketProducts: assign({
        lookups: (
          {
            lookups,
            parseBasketProduct: parseProduct
          }: DomainRegistrantContext,
          { data }: AnyEventObject
        ) => {
          if (!isObject(data) || !has(data, "products")) return lookups;

          const available = reduce(
            data.products,
            (result: BasketProduct[], raw: IBasketProduct) => {
              const parsed = parseProduct?.(raw);
              if (parsed && !some(result, ["id", parsed.id])) {
                result.push(parsed);
              }
              return result;
            },
            []
          );

          set(lookups, "basketProducts", available);
          return lookups;
        }
      }),

      // --- selection
      setSelectedProducts: assign({
        model: (_context: DomainRegistrantContext, event: AnyEventObject) =>
          (event.productIds as string[]) ?? []
      }),

      // Override model if productIds provided in event
      setModelOverride: assign(
        (_context: DomainRegistrantContext, event: AnyEventObject) => {
          if (event.productIds) {
            return { model: event.productIds as string[] };
          }
          return {};
        }
      ),

      // --- error
      setError: assign({
        error: (_context: DomainRegistrantContext, event: AnyEventObject) =>
          mapToHeadlessError(event.data) as ResponseError
      })
    },
    guards: {
      hasDomainProducts: (context: DomainRegistrantContext) =>
        context.lookups.basketProducts.length > 0
    },
    services
  }
);
