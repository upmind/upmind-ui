// --- external
import type { ActorRef } from "xstate";

// --- internal
import type { ResponseError } from "../../utils";
import type { Address, Company } from "../client";
import type { BasketProduct } from "../basketProduct/types";

// -----------------------------------------------------------------------------

/**
 * Context shape for the registrant XState machine.
 */
export type DomainRegistrantContext = {
  /** Domain products from basket. */
  lookups: {
    basketProducts: BasketProduct[];
  };
  /** Selected product IDs (from checkboxes). */
  model: string[];
  /** Error from last operation. */
  error?: ResponseError;
  /** Auth helper actor. */
  authHelper?: ActorRef<any>;
  /** Basket helper actor. */
  basketHelper?: ActorRef<any>;
  /** Parser function for domain basket products. */
  parseBasketProduct?: (raw: any) => BasketProduct | undefined;
};

/**
 * Events for the registrant machine.
 */
export type DomainRegistrantEvent =
  | { type: "REFRESH"; data?: any }
  | { type: "STOP" }
  | { type: "AUTHENTICATED" }
  | { type: "UNAUTHENTICATED" }
  | { type: "SET"; productIds: string[] }
  | {
      type: "APPLY_BILLING";
      billing: Address | Company;
      productIds?: string[];
    }
  | {
      type: "APPLY_PROVISION";
      data: Record<string, string>;
      productIds?: string[];
    };
