// --- external
import type { ActorRef } from "xstate";

// --- internal
import type { ResponseError } from "../../utils";
import type { Address, Company } from "../client";
import type { DomainProduct } from "../domain/types";

// -----------------------------------------------------------------------------

/**
 * Status of registrant data for a domain product.
 */
export enum DOMAIN_REGISTRANT_PRODUCT_STATUS {
  INCOMPLETE = "incomplete",
  COMPLETE = "complete",
  SKIPPED = "skipped"
}
export type DomainRegistrantProductStatus =
  `${DOMAIN_REGISTRANT_PRODUCT_STATUS}`;

/**
 * Per-product registrant state tracked by the machine.
 */
export type DomainRegistrantProductState = {
  /** Basket product ID. */
  id: string;
  /** Domain name (e.g., "example.com"). */
  domain: string;
  /** Current registrant data keyed by provision field name. */
  data: Record<string, string>;
  /** Status: incomplete | complete | skipped. */
  status: DomainRegistrantProductStatus;
};

/**
 * Context shape for the registrant XState machine.
 */
export type DomainRegistrantContext = {
  /** Per-product registrant data state. */
  products: Map<string, DomainRegistrantProductState>;
  /** Domain products from basket. */
  lookups: {
    basket: DomainProduct[];
  };
  /** Billing source for pre-filling (Address or Company). */
  model: Address | Company | null;
  /** Error from last operation. */
  error: ResponseError | null;
  /** Product ID currently being saved. */
  savingProductId: string | null;
  /** Basket ID. */
  basketId?: string;
  /** Brand ID. */
  brandId?: string;
  /** Currency code. */
  currency?: string;
  /** Auth helper actor. */
  authHelper?: ActorRef<any>;
  /** Basket helper actor. */
  basketHelper?: ActorRef<any>;
  /** Parser function for basket products. */
  parseBasketProduct?: (
    raw: any,
    primaryDomain?: string
  ) => DomainProduct | undefined;
};

/**
 * Events for the registrant machine.
 */
export type DomainRegistrantEvent =
  | { type: "REFRESH"; data?: any }
  | { type: "STOP" }
  | { type: "AUTHENTICATED" }
  | { type: "UNAUTHENTICATED" }
  | { type: "SET_BILLING"; data: Address | Company | null }
  | { type: "APPLY_BILLING"; productIds: string[] }
  | { type: "SET"; productId: string; data: Record<string, string> }
  | { type: "SAVE"; productId: string }
  | { type: "SKIP"; productId: string }
  | { type: "UNSKIP"; productId: string };

/**
 * Required registrant field keys.
 */
export const REQUIRED_REGISTRANT_FIELDS = [
  "registrant_email",
  "registrant_phone",
  "registrant_address_1",
  "registrant_city",
  "registrant_postcode",
  "registrant_country"
] as const;

/**
 * Maps provision field names → billing source keys (Address/Company paths).
 */
export const PROVISION_TO_BILLING_MAP: Record<string, string> = {
  registrant_name: "address.name",
  registrant_organisation: "company.name",
  registrant_email: "address.email",
  registrant_phone: "address.phone",
  registrant_address_1: "address.address1",
  registrant_city: "address.city",
  registrant_state: "address.state",
  registrant_postcode: "address.postcode",
  registrant_country: "address.country_code"
};
