// --- external
import type { ActorRef } from "xstate";

// --- internal
import type { ResponseError } from "../../utils";
import type { Address, Company } from "../client";
import type { BasketProduct } from "../basketProduct/types";
import type { IBasketProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export enum DomainRegistrantEventType {
  APPLY_BILLING = "APPLY_BILLING",
  APPLY_PROVISION = "APPLY_PROVISION",
  REFRESH = "REFRESH",
  SET = "SET"
}

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
  parseBasketProduct: (raw: IBasketProduct) => BasketProduct | undefined;
};
